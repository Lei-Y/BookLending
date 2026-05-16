using System.Net;
using System.Net.Http.Json;
using BookLending.Domain;
using Xunit;

namespace BookLending.IntegrationTests;

/// <summary>
/// End-to-end tests that exercise the real HTTP pipeline: routing,
/// model binding, JSON serialisation, DI, and middleware.
/// </summary>
public class BooksApiTests : IClassFixture<IsolatedFactory>
{
    private readonly HttpClient _client;

    public BooksApiTests(IsolatedFactory factory)
    {
        // xUnit constructs the test class fresh for each [Fact], so resetting
        // here gives every test a clean repository while still sharing the
        // (expensive to build) host across the class.
        factory.ResetState();
        _client = factory.CreateClient();
    }

    // ---------- Helpers ----------

    private async Task<Book> CreateAsync(string title, string owner)
    {
        var response = await _client.PostAsJsonAsync(
            "/api/books",
            new { title, owner });
        response.EnsureSuccessStatusCode();
        var book = await response.Content.ReadFromJsonAsync<Book>();
        Assert.NotNull(book);
        return book!;
    }

    // ---------- Tests ----------

    [Fact]
    public async Task Get_EmptyRepository_ReturnsEmptyPage()
    {
        var response = await _client.GetAsync("/api/books");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var page = await response.Content.ReadFromJsonAsync<PagedResult<Book>>();
        Assert.NotNull(page);
        Assert.Empty(page!.Items);
        Assert.Equal(0, page.TotalCount);
    }

    [Fact]
    public async Task Post_ReturnsCreated_AndExposesLocationHeader()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/books",
            new { title = "Test-Driven Development", owner = "Kent Beck" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);

        var created = await response.Content.ReadFromJsonAsync<Book>();
        Assert.NotNull(created);
        Assert.Equal("Test-Driven Development", created!.Title);
        Assert.Equal("Kent Beck", created.Owner);
        Assert.True(created.Available);
        Assert.NotEqual(Guid.Empty, created.Id);
    }

    [Fact]
    public async Task Post_BlankTitle_Returns400()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/books",
            new { title = "", owner = "Anyone" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_ById_RoundTripsThroughHttp()
    {
        var created = await CreateAsync("Refactoring", "Martin Fowler");

        var fetched = await _client.GetFromJsonAsync<Book>($"/api/books/{created.Id}");

        Assert.NotNull(fetched);
        Assert.Equal(created.Id, fetched!.Id);
        Assert.Equal(created.Title, fetched.Title);
    }

    [Fact]
    public async Task Get_NonExistentId_Returns404()
    {
        var response = await _client.GetAsync($"/api/books/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Toggle_FlipsAvailability()
    {
        var created = await CreateAsync("Clean Code", "Robert Martin");

        var response = await _client.PatchAsync($"/api/books/{created.Id}/toggle", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var toggled = await response.Content.ReadFromJsonAsync<Book>();
        Assert.False(toggled!.Available);
    }

    [Fact]
    public async Task Toggle_NonExistent_Returns404()
    {
        var response = await _client.PatchAsync($"/api/books/{Guid.NewGuid()}/toggle", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_RemovesBook()
    {
        var created = await CreateAsync("Throwaway", "Owner");

        var delete = await _client.DeleteAsync($"/api/books/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        var fetch = await _client.GetAsync($"/api/books/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, fetch.StatusCode);
    }

    [Fact]
    public async Task Delete_NonExistent_Returns404()
    {
        var response = await _client.DeleteAsync($"/api/books/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Query_FiltersBySearchAndAvailability()
    {
        var a = await CreateAsync("Domain-Driven Design", "Eric Evans");
        await CreateAsync("Patterns of Enterprise Application Architecture", "Martin Fowler");
        var c = await CreateAsync("Designing Data-Intensive Applications", "Martin Kleppmann");

        // Borrow `a` so the availability filter has something to bite on
        await _client.PatchAsync($"/api/books/{a.Id}/toggle", null);

        var available = await _client.GetFromJsonAsync<PagedResult<Book>>(
            "/api/books?availability=Available");
        var unavailable = await _client.GetFromJsonAsync<PagedResult<Book>>(
            "/api/books?availability=Unavailable");
        var searched = await _client.GetFromJsonAsync<PagedResult<Book>>(
            "/api/books?search=designing");

        Assert.Equal(2, available!.TotalCount);
        Assert.Equal(1, unavailable!.TotalCount);
        Assert.Equal(a.Id, unavailable.Items[0].Id);
        Assert.Single(searched!.Items);
        Assert.Equal(c.Id, searched.Items[0].Id);
    }

    [Fact]
    public async Task Query_PaginationRespectsPageSize()
    {
        foreach (var title in new[] { "Alpha", "Bravo", "Charlie", "Delta", "Echo" })
        {
            await CreateAsync(title, "owner");
        }

        var page1 = await _client.GetFromJsonAsync<PagedResult<Book>>(
            "/api/books?page=1&pageSize=2");
        var page3 = await _client.GetFromJsonAsync<PagedResult<Book>>(
            "/api/books?page=3&pageSize=2");

        Assert.Equal(5, page1!.TotalCount);
        Assert.Equal(3, page1.TotalPages);
        Assert.Equal(2, page1.Items.Count);
        Assert.Single(page3!.Items);
    }

    [Fact]
    public async Task Json_UsesCamelCasePropertyNames()
    {
        // Catches a class of "the .NET test passes but the React app can't read
        // the response" bugs caused by mis-configured JsonSerializerOptions.
        await CreateAsync("Eloquent JavaScript", "Marijn Haverbeke");

        var raw = await _client.GetStringAsync("/api/books");

        Assert.Contains("\"title\":", raw);
        Assert.Contains("\"owner\":", raw);
        Assert.Contains("\"available\":", raw);
        Assert.DoesNotContain("\"Title\":", raw);
    }
}

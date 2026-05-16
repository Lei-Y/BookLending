using System.Net;
using System.Net.Http.Json;
using BookLending.Domain;
using Xunit;

namespace BookLending.IntegrationTests;

/// <summary>
/// Smoke tests against the Development startup configuration so the lines
/// that wire up OpenAPI / Scalar and the seed step are exercised. These
/// tests share a single host (the seed has to run exactly once) and only
/// assert observable behaviour, not implementation detail.
/// </summary>
public class DevelopmentStartupTests : IClassFixture<DevelopmentFactory>
{
    private readonly HttpClient _client;

    public DevelopmentStartupTests(DevelopmentFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task OpenApi_DocumentIsServed()
    {
        var response = await _client.GetAsync("/openapi/v1.json");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"openapi\"", body);
        Assert.Contains("/api/Books", body);
    }

    [Fact]
    public async Task Scalar_UiIsServed()
    {
        var response = await _client.GetAsync("/scalar/v1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Seed_PopulatesRepository_OnStartup()
    {
        var page = await _client.GetFromJsonAsync<PagedResult<Book>>(
            "/api/books?pageSize=50");

        Assert.NotNull(page);
        Assert.NotEmpty(page!.Items);
    }
}

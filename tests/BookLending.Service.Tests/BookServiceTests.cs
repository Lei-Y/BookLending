using BookLending.Domain;
using BookLending.Infrastructure;
using BookLending.Service;
using Xunit;

namespace BookLending.Service.Tests;

public class BookServiceTests
{
    private static BookService NewService() => new(new InMemoryBookRepository());

    [Fact]
    public void Create_TrimsAndDefaultsAvailableTrue()
    {
        var svc = NewService();
        var book = svc.Create("  Refactoring  ", "  Alice  ");
        Assert.Equal("Refactoring", book.Title);
        Assert.Equal("Alice", book.Owner);
        Assert.True(book.Available);
        Assert.NotEqual(Guid.Empty, book.Id);
    }

    [Theory]
    [InlineData("", "Alice")]
    [InlineData("  ", "Alice")]
    [InlineData("Title", "")]
    public void Create_RejectsBlankFields(string title, string owner)
    {
        var svc = NewService();
        Assert.Throws<ArgumentException>(() => svc.Create(title, owner));
    }

    [Fact]
    public void Toggle_FlipsAvailability()
    {
        var svc = NewService();
        var book = svc.Create("Clean Code", "Bob");
        Assert.True(book.Available);

        var toggled = svc.ToggleAvailability(book.Id);
        Assert.NotNull(toggled);
        Assert.False(toggled!.Available);

        var again = svc.ToggleAvailability(book.Id);
        Assert.True(again!.Available);
    }

    [Fact]
    public void Toggle_ReturnsNullWhenMissing()
    {
        var svc = NewService();
        Assert.Null(svc.ToggleAvailability(Guid.NewGuid()));
    }

    [Fact]
    public void Query_FiltersBySearchCaseInsensitive()
    {
        var svc = NewService();
        svc.Create("Clean Code", "Bob");
        svc.Create("Refactoring", "Alice");
        svc.Create("Domain-Driven Design", "Carol");

        var result = svc.Query(new BookQuery { Search = "clean" });

        Assert.Single(result.Items);
        Assert.Equal("Clean Code", result.Items[0].Title);
    }

    [Fact]
    public void Query_FiltersByAvailability()
    {
        var svc = NewService();
        var a = svc.Create("A", "x");
        var b = svc.Create("B", "y");
        svc.ToggleAvailability(b.Id);

        var available = svc.Query(new BookQuery { Availability = AvailabilityFilter.Available });
        var unavailable = svc.Query(new BookQuery { Availability = AvailabilityFilter.Unavailable });

        Assert.Single(available.Items);
        Assert.Equal(a.Id, available.Items[0].Id);
        Assert.Single(unavailable.Items);
        Assert.Equal(b.Id, unavailable.Items[0].Id);
    }

    [Fact]
    public void Delete_RemovesExistingBook()
    {
        var svc = NewService();
        var book = svc.Create("Throwaway", "Owner");

        var removed = svc.Delete(book.Id);

        Assert.True(removed);
        Assert.Null(svc.GetById(book.Id));
    }

    [Fact]
    public void Delete_ReturnsFalseWhenMissing()
    {
        var svc = NewService();
        Assert.False(svc.Delete(Guid.NewGuid()));
    }

    [Fact]
    public void Update_ReturnsFalseWhenBookMissing()
    {
        // Exercises the repository's Update failure branch directly,
        // which BookService never hits because ToggleAvailability guards
        // against missing IDs before calling Update.
        var repo = new InMemoryBookRepository();
        var ghost = new Book { Id = Guid.NewGuid(), Title = "Ghost", Owner = "Nobody" };

        Assert.False(repo.Update(ghost));
    }

    [Fact]
    public void PagedResult_TotalPages_IsZeroWhenPageSizeIsZero()
    {
        // Guards against divide-by-zero in the defensive branch of
        // PagedResult.TotalPages. BookService clamps PageSize >= 1 before
        // building the result, so this branch is unreachable through the
        // service but is still part of the Domain contract.
        var result = new PagedResult<Book> { TotalCount = 42, PageSize = 0 };

        Assert.Equal(0, result.TotalPages);
    }

    [Fact]
    public void Seeder_PopulatesEmptyRepository()
    {
        var repo = new InMemoryBookRepository();

        BookSeeder.Seed(repo);

        var all = repo.GetAll().ToList();
        Assert.NotEmpty(all);
        Assert.All(all, b =>
        {
            Assert.NotEqual(Guid.Empty, b.Id);
            Assert.False(string.IsNullOrWhiteSpace(b.Title));
            Assert.False(string.IsNullOrWhiteSpace(b.Owner));
        });
    }

    [Fact]
    public void Query_PaginatesAndOrdersByTitle()
    {
        var svc = NewService();
        foreach (var t in new[] { "Charlie", "Alpha", "Bravo", "Delta", "Echo" })
        {
            svc.Create(t, "owner");
        }

        var page1 = svc.Query(new BookQuery { Page = 1, PageSize = 2 });
        var page3 = svc.Query(new BookQuery { Page = 3, PageSize = 2 });

        Assert.Equal(5, page1.TotalCount);
        Assert.Equal(3, page1.TotalPages);
        Assert.Equal(new[] { "Alpha", "Bravo" }, page1.Items.Select(b => b.Title));
        Assert.Single(page3.Items);
        Assert.Equal("Echo", page3.Items[0].Title);
    }
}

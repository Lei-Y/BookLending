using BookLending.Domain;

namespace BookLending.Service;

public class BookService : IBookService
{
    private readonly IBookRepository _repo;

    public BookService(IBookRepository repo) => _repo = repo;

    public PagedResult<Book> Query(BookQuery query)
    {
        var page = Math.Max(1, query.Page);
        var size = Math.Clamp(query.PageSize, 1, 100);

        IEnumerable<Book> q = _repo.GetAll();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            q = q.Where(b => b.Title.Contains(term, StringComparison.OrdinalIgnoreCase));
        }

        q = query.Availability switch
        {
            AvailabilityFilter.Available => q.Where(b => b.Available),
            AvailabilityFilter.Unavailable => q.Where(b => !b.Available),
            _ => q
        };

        var ordered = q.OrderBy(b => b.Title, StringComparer.OrdinalIgnoreCase).ToList();
        var items = ordered.Skip((page - 1) * size).Take(size).ToList();

        return new PagedResult<Book>
        {
            Items = items,
            Page = page,
            PageSize = size,
            TotalCount = ordered.Count
        };
    }

    public Book? GetById(Guid id) => _repo.GetById(id);

    public Book Create(string title, string owner)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Title required", nameof(title));
        }

        if (string.IsNullOrWhiteSpace(owner))
        {
            throw new ArgumentException("Owner required", nameof(owner));
        }

        var book = new Book { Title = title.Trim(), Owner = owner.Trim(), Available = true };
        _repo.Add(book);
        return book;
    }

    public bool Delete(Guid id) => _repo.Delete(id);

    public Book? ToggleAvailability(Guid id)
    {
        var book = _repo.GetById(id);
        if (book == null)
        {
            return null;
        }

        book.Available = !book.Available;
        _repo.Update(book);
        return book;
    }
}

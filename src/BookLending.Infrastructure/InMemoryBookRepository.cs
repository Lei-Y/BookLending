using System.Collections.Concurrent;
using BookLending.Domain;

namespace BookLending.Infrastructure;

public class InMemoryBookRepository : IBookRepository
{
    private readonly ConcurrentDictionary<Guid, Book> _store = new();

    public IEnumerable<Book> GetAll() => _store.Values;

    public Book? GetById(Guid id) => _store.TryGetValue(id, out var b) ? b : null;

    public void Add(Book book)
    {
        if (book.Id == Guid.Empty)
        {
            book.Id = Guid.NewGuid();
        }

        _store[book.Id] = book;
    }

    public bool Update(Book book)
    {
        if (!_store.ContainsKey(book.Id))
        {
            return false;
        }

        _store[book.Id] = book;
        return true;
    }

    public bool Delete(Guid id) => _store.TryRemove(id, out _);
}

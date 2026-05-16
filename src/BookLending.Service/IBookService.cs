using BookLending.Domain;

namespace BookLending.Service;

public interface IBookService
{
    PagedResult<Book> Query(BookQuery query);
    Book? GetById(Guid id);
    Book Create(string title, string owner);
    bool Delete(Guid id);
    Book? ToggleAvailability(Guid id);
}

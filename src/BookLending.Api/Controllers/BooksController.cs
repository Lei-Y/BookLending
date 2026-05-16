using BookLending.Domain;
using BookLending.Service;
using Microsoft.AspNetCore.Mvc;

namespace BookLending.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly IBookService _service;

    public BooksController(IBookService service) => _service = service;

    public record CreateBookRequest(string Title, string Owner);

    [HttpGet]
    public ActionResult<PagedResult<Book>> Get(
        [FromQuery] string? search,
        [FromQuery] AvailabilityFilter availability = AvailabilityFilter.All,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = _service.Query(new BookQuery
        {
            Search = search,
            Availability = availability,
            Page = page,
            PageSize = pageSize
        });
        return Ok(result);
    }

    [HttpPost]
    public ActionResult<Book> Create([FromBody] CreateBookRequest request)
    {
        try
        {
            var book = _service.Create(request.Title, request.Owner);
            return CreatedAtAction(nameof(GetById), new { id = book.Id }, book);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public ActionResult<Book> GetById(Guid id)
    {
        var book = _service.GetById(id);
        return book is null ? NotFound() : Ok(book);
    }

    [HttpPatch("{id:guid}/toggle")]
    public ActionResult<Book> Toggle(Guid id)
    {
        var book = _service.ToggleAvailability(id);
        return book is null ? NotFound() : Ok(book);
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id) =>
        _service.Delete(id) ? NoContent() : NotFound();
}

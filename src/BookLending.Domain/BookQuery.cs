namespace BookLending.Domain;

public enum AvailabilityFilter { All, Available, Unavailable }

public class BookQuery
{
    public string? Search { get; set; }
    public AvailabilityFilter Availability { get; set; } = AvailabilityFilter.All;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
    public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling((double)TotalCount / PageSize);
}

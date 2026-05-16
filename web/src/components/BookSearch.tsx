import type { AvailabilityFilter } from "../types/book";

interface Props {
  search: string;
  availability: AvailabilityFilter;
  onSearchChange: (value: string) => void;
  onAvailabilityChange: (value: AvailabilityFilter) => void;
}

export function BookSearch({ search, availability, onSearchChange, onAvailabilityChange }: Props) {
  return (
    <div className="toolbar">
      <label className="toolbar__field">
        <span>Book Search:</span>
        <input
          type="search"
          value={search}
          placeholder="Filter by title…"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </label>
      <label className="toolbar__field">
        <span>Availability:</span>
        <select
          value={availability}
          onChange={(e) => onAvailabilityChange(e.target.value as AvailabilityFilter)}
        >
          <option value="All">All</option>
          <option value="Available">Available</option>
          <option value="Unavailable">Unavailable</option>
        </select>
      </label>
    </div>
  );
}

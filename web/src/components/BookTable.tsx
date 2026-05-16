import type { Book } from "../types/book";
import { BookRow } from "./BookRow";

interface Props {
  books: Book[];
  loading: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function BookTable({ books, loading, onToggle, onDelete }: Props) {
  if (loading) return <p className="state">Loading…</p>;
  if (books.length === 0) return <p className="state">No books match the current filters.</p>;

  return (
    <table className="book-table">
      <thead>
        <tr>
          <th>Book</th>
          <th>Owner</th>
          <th>Availability</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {books.map((b) => (
          <BookRow key={b.id} book={b} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </tbody>
    </table>
  );
}

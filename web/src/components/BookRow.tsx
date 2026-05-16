import type { Book } from "../types/book";

interface Props {
  book: Book;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function BookRow({ book, onToggle, onDelete }: Props) {
  return (
    <tr>
      <td>{book.title}</td>
      <td>{book.owner}</td>
      <td>
        <span className={`badge badge--${book.available ? "available" : "unavailable"}`}>
          {book.available ? "Available" : "Borrowed"}
        </span>
      </td>
      <td className="row-actions">
        <button
          type="button"
          onClick={() => onToggle(book.id)}
          title={book.available ? "Mark as borrowed" : "Mark as returned"}
        >
          {book.available ? "Borrow" : "Return"}
        </button>
        <button
          type="button"
          className="btn-danger"
          onClick={() => onDelete(book.id)}
          title="Delete book"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

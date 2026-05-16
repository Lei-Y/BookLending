import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Book } from "../types/book";
import { BookRow } from "./BookRow";

const renderRow = (book: Partial<Book> = {}) => {
  const onToggle = vi.fn();
  const onDelete = vi.fn();
  const full: Book = {
    id: "abc-123",
    title: "Refactoring",
    owner: "Martin Fowler",
    available: true,
    ...book,
  };
  render(
    <table>
      <tbody>
        <BookRow book={full} onToggle={onToggle} onDelete={onDelete} />
      </tbody>
    </table>
  );
  return { onToggle, onDelete, book: full };
};

describe("BookRow", () => {
  it("renders the title and owner", () => {
    renderRow({ title: "Clean Code", owner: "Robert Martin" });
    expect(screen.getByText("Clean Code")).toBeInTheDocument();
    expect(screen.getByText("Robert Martin")).toBeInTheDocument();
  });

  it("shows 'Borrow' when the book is available", () => {
    renderRow({ available: true });
    expect(screen.getByRole("button", { name: /borrow/i })).toBeInTheDocument();
    expect(screen.getByText(/^Available$/)).toBeInTheDocument();
  });

  it("shows 'Return' when the book is borrowed", () => {
    renderRow({ available: false });
    expect(screen.getByRole("button", { name: /return/i })).toBeInTheDocument();
    expect(screen.getByText(/^Borrowed$/)).toBeInTheDocument();
  });

  it("invokes onToggle and onDelete with the book id", async () => {
    const user = userEvent.setup();
    const { onToggle, onDelete, book } = renderRow();

    await user.click(screen.getByRole("button", { name: /borrow/i }));
    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(onToggle).toHaveBeenCalledWith(book.id);
    expect(onDelete).toHaveBeenCalledWith(book.id);
  });
});

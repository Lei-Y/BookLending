import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Book, BookQueryParams, PagedResult } from "../types/book";

// Mock the API module so we never hit the network. Each test sets up the
// behaviour it cares about by reading/writing the shared `store` below.
vi.mock("../api/booksApi", () => ({
  fetchBooks: vi.fn(),
  createBook: vi.fn(),
  toggleBook: vi.fn(),
  deleteBook: vi.fn(),
}));

import * as api from "../api/booksApi";
import { LibraryPage } from "./LibraryPage";

const PAGE_SIZE = 5;

interface Store {
  books: Book[];
}

function buildPage(store: Store, params: BookQueryParams): PagedResult<Book> {
  let items = [...store.books];
  if (params.search) {
    const term = params.search.toLowerCase();
    items = items.filter((b) => b.title.toLowerCase().includes(term));
  }
  if (params.availability === "Available") items = items.filter((b) => b.available);
  if (params.availability === "Unavailable") items = items.filter((b) => !b.available);

  items.sort((a, b) => a.title.localeCompare(b.title));

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? PAGE_SIZE;
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);

  return {
    items: slice,
    page,
    pageSize,
    totalCount: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
}

let store: Store;

beforeEach(() => {
  store = { books: [] };

  vi.mocked(api.fetchBooks).mockImplementation(async (params) => buildPage(store, params));
  vi.mocked(api.createBook).mockImplementation(async (title, owner) => {
    const book: Book = { id: crypto.randomUUID(), title, owner, available: true };
    store.books.push(book);
    return book;
  });
  vi.mocked(api.toggleBook).mockImplementation(async (id) => {
    const book = store.books.find((b) => b.id === id)!;
    book.available = !book.available;
    return book;
  });
  vi.mocked(api.deleteBook).mockImplementation(async (id) => {
    store.books = store.books.filter((b) => b.id !== id);
  });

  // The delete handler asks for confirmation via window.confirm; auto-accept.
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LibraryPage", () => {
  it("renders the books returned by the API", async () => {
    store.books = [
      { id: "1", title: "Refactoring", owner: "Fowler", available: true },
      { id: "2", title: "Clean Code", owner: "Martin", available: false },
    ];

    render(<LibraryPage />);

    expect(await screen.findByText("Refactoring")).toBeInTheDocument();
    expect(screen.getByText("Clean Code")).toBeInTheDocument();
  });

  it("filters by title via the search input", async () => {
    const user = userEvent.setup();
    store.books = [
      { id: "1", title: "Refactoring", owner: "x", available: true },
      { id: "2", title: "Clean Code", owner: "y", available: true },
    ];

    render(<LibraryPage />);
    await screen.findByText("Refactoring");

    await user.type(screen.getByRole("searchbox"), "clean");

    await waitFor(() => {
      expect(screen.queryByText("Refactoring")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Clean Code")).toBeInTheDocument();
  });

  it("toggles availability through the row action", async () => {
    const user = userEvent.setup();
    store.books = [{ id: "1", title: "Refactoring", owner: "x", available: true }];

    render(<LibraryPage />);
    await screen.findByText("Refactoring");

    await user.click(screen.getByRole("button", { name: /borrow/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /return/i })).toBeInTheDocument();
    });
    expect(api.toggleBook).toHaveBeenCalledWith("1");
  });

  it("creates a book via the modal and shows it in the table", async () => {
    const user = userEvent.setup();
    render(<LibraryPage />);
    await screen.findByText(/no books match/i);

    await user.click(screen.getByRole("button", { name: /add book/i }));
    const [titleInput, ownerInput] = screen.getAllByRole("textbox");
    await user.type(titleInput, "Domain-Driven Design");
    await user.type(ownerInput, "Eric Evans");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(await screen.findByText("Domain-Driven Design")).toBeInTheDocument();
    expect(api.createBook).toHaveBeenCalledWith("Domain-Driven Design", "Eric Evans");
  });

  it("filters by availability via the dropdown", async () => {
    const user = userEvent.setup();
    store.books = [
      { id: "1", title: "Alpha", owner: "x", available: true },
      { id: "2", title: "Bravo", owner: "y", available: false },
    ];

    render(<LibraryPage />);
    await screen.findByText("Alpha");

    await user.selectOptions(screen.getByRole("combobox"), "Unavailable");

    await waitFor(() => {
      expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Bravo")).toBeInTheDocument();
  });

  it("shows an error when fetchBooks rejects", async () => {
    vi.mocked(api.fetchBooks).mockRejectedValueOnce(new Error("network exploded"));

    render(<LibraryPage />);

    expect(await screen.findByText(/network exploded/i)).toBeInTheDocument();
  });

  it("shows an error when toggleBook rejects", async () => {
    const user = userEvent.setup();
    store.books = [{ id: "1", title: "Refactoring", owner: "x", available: true }];
    vi.mocked(api.toggleBook).mockRejectedValueOnce(new Error("toggle broke"));

    render(<LibraryPage />);
    await screen.findByText("Refactoring");

    await user.click(screen.getByRole("button", { name: /borrow/i }));

    expect(await screen.findByText(/toggle broke/i)).toBeInTheDocument();
  });

  it("shows an error when deleteBook rejects", async () => {
    const user = userEvent.setup();
    store.books = [{ id: "1", title: "Refactoring", owner: "x", available: true }];
    vi.mocked(api.deleteBook).mockRejectedValueOnce(new Error("delete broke"));

    render(<LibraryPage />);
    await screen.findByText("Refactoring");

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(await screen.findByText(/delete broke/i)).toBeInTheDocument();
  });

  it("closes the modal when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<LibraryPage />);
    await screen.findByText(/no books match/i);

    await user.click(screen.getByRole("button", { name: /add book/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("bounces back one page when the last item on the current page is deleted", async () => {
    const user = userEvent.setup();
    // Six books across two pages of five — page 2 holds exactly one book.
    store.books = Array.from({ length: 6 }, (_, i) => ({
      id: String(i),
      title: `Book ${String.fromCharCode(65 + i)}`,
      owner: "x",
      available: true,
    }));

    render(<LibraryPage />);
    await screen.findByText("Book A");

    await user.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText("Book F");

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    // After deletion, page 2 is empty, so the component should land back on
    // page 1 and show the first batch of titles again.
    await waitFor(() => {
      expect(screen.getByText("Book A")).toBeInTheDocument();
    });
    expect(screen.queryByText("Book F")).not.toBeInTheDocument();
  });
});

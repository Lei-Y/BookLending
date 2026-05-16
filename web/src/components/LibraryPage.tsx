import { useCallback, useEffect, useState } from "react";
import { createBook, deleteBook, fetchBooks, toggleBook } from "../api/booksApi";
import type { AvailabilityFilter, Book } from "../types/book";
import { AddBookModal } from "./AddBookModal";
import { BookSearch } from "./BookSearch";
import { BookTable } from "./BookTable";
import { Pagination } from "./Pagination";

const PAGE_SIZE = 5;

export function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState<AvailabilityFilter>("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchBooks(
          { search, availability, page, pageSize: PAGE_SIZE },
          signal
        );
        setBooks(result.items);
        setTotalPages(Math.max(1, result.totalPages));
        // If we deleted the last item on a page, bounce back one page.
        if (result.items.length === 0 && page > 1) {
          setPage((p) => Math.max(1, p - 1));
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load books.");
      } finally {
        setLoading(false);
      }
    },
    [search, availability, page]
  );

  useEffect(() => {
    const controller = new AbortController();
    // The fetch is an external sync point; setState calls inside `load`
    // are intentional and unavoidable for a fetch-on-change pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // Reset page in the change handlers (not in an effect) so we never derive
  // state from state via cascading renders.
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const handleAvailabilityChange = (value: AvailabilityFilter) => {
    setAvailability(value);
    setPage(1);
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleBook(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toggle failed.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this book from the library?")) return;
    try {
      await deleteBook(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const handleCreate = async (title: string, owner: string) => {
    setSubmitting(true);
    try {
      await createBook(title, owner);
      setModalOpen(false);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <header className="page__header">
        <h1>Library</h1>
      </header>

      <BookSearch
        search={search}
        availability={availability}
        onSearchChange={handleSearchChange}
        onAvailabilityChange={handleAvailabilityChange}
      />

      {error && <p className="error">{error}</p>}

      <BookTable books={books} loading={loading} onToggle={handleToggle} onDelete={handleDelete} />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <button
        type="button"
        className="fab"
        onClick={() => setModalOpen(true)}
        aria-label="Add book"
      >
        + Add Book
      </button>

      <AddBookModal
        open={modalOpen}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}

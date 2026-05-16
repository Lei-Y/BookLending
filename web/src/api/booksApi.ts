import type { Book, BookQueryParams, PagedResult } from "../types/book";

// Base URL is overridable via VITE_API_BASE_URL so the same build can target
// different environments without code changes.
const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:5110";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function fetchBooks(
  params: BookQueryParams,
  signal?: AbortSignal
): Promise<PagedResult<Book>> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.availability && params.availability !== "All")
    qs.set("availability", params.availability);
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));

  const res = await fetch(`${API_BASE}/api/books?${qs}`, { signal });
  return handle<PagedResult<Book>>(res);
}

export async function createBook(title: string, owner: string): Promise<Book> {
  const res = await fetch(`${API_BASE}/api/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, owner }),
  });
  return handle<Book>(res);
}

export async function toggleBook(id: string): Promise<Book> {
  const res = await fetch(`${API_BASE}/api/books/${id}/toggle`, {
    method: "PATCH",
  });
  return handle<Book>(res);
}

export async function deleteBook(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/books/${id}`, { method: "DELETE" });
  await handle<void>(res);
}

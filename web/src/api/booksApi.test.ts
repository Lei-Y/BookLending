import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBook, deleteBook, fetchBooks, toggleBook } from "./booksApi";

const API = "http://localhost:5110";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("booksApi", () => {
  it("builds the query string from supplied parameters", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ items: [], page: 1, pageSize: 5, totalCount: 0, totalPages: 0 })
    );

    await fetchBooks({
      search: "clean",
      availability: "Available",
      page: 2,
      pageSize: 5,
    });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain(`${API}/api/books?`);
    expect(url).toContain("search=clean");
    expect(url).toContain("availability=Available");
    expect(url).toContain("page=2");
    expect(url).toContain("pageSize=5");
  });

  it("omits the availability parameter when set to 'All'", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ items: [], page: 1, pageSize: 5, totalCount: 0, totalPages: 0 })
    );

    await fetchBooks({ availability: "All" });

    const [url] = fetchMock.mock.calls[0];
    expect(url).not.toContain("availability=");
  });

  it("posts JSON to create a book", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { id: "1", title: "X", owner: "Y", available: true },
        { status: 201 }
      )
    );

    const book = await createBook("X", "Y");

    expect(book).toEqual({ id: "1", title: "X", owner: "Y", available: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/api/books`);
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ title: "X", owner: "Y" });
  });

  it("PATCHes the toggle endpoint", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: "1", title: "X", owner: "Y", available: false })
    );

    await toggleBook("1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/api/books/1/toggle`);
    expect(init.method).toBe("PATCH");
  });

  it("returns void on a successful delete (204)", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await deleteBook("1");

    expect(result).toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/api/books/1`);
    expect(init.method).toBe("DELETE");
  });

  it("throws an error including status code on non-2xx responses", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("boom", { status: 500, statusText: "Server Error" })
    );

    await expect(deleteBook("1")).rejects.toThrow(/API 500/);
  });
});

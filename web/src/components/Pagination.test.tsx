import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("renders nothing when there is only one page", () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("disables Prev on the first page and Next on the last page", () => {
    render(<Pagination page={1} totalPages={3} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /prev/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();
  });

  it("disables Next on the last page", () => {
    render(<Pagination page={3} totalPages={3} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /prev/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("calls onChange with the next page when Next is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination page={1} totalPages={3} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /next/i }));

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("calls onChange with the previous page when Prev is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /prev/i }));

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("shows the current page and total pages", () => {
    render(<Pagination page={2} totalPages={5} onChange={() => {}} />);
    expect(screen.getByText("2 of 5")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BookSearch } from "./BookSearch";

describe("BookSearch", () => {
  it("fires onSearchChange with each keystroke", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(
      <BookSearch
        search=""
        availability="All"
        onSearchChange={onSearchChange}
        onAvailabilityChange={() => {}}
      />
    );

    await user.type(screen.getByRole("searchbox"), "ab");

    expect(onSearchChange).toHaveBeenCalledTimes(2);
    expect(onSearchChange).toHaveBeenNthCalledWith(1, "a");
    expect(onSearchChange).toHaveBeenNthCalledWith(2, "b");
  });

  it("fires onAvailabilityChange when the filter changes", async () => {
    const user = userEvent.setup();
    const onAvailabilityChange = vi.fn();
    render(
      <BookSearch
        search=""
        availability="All"
        onSearchChange={() => {}}
        onAvailabilityChange={onAvailabilityChange}
      />
    );

    await user.selectOptions(screen.getByRole("combobox"), "Available");

    expect(onAvailabilityChange).toHaveBeenCalledWith("Available");
  });
});

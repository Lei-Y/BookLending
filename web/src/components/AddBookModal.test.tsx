import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddBookModal } from "./AddBookModal";

describe("AddBookModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <AddBookModal open={false} submitting={false} onClose={() => {}} onSubmit={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a validation error when fields are blank", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AddBookModal open submitting={false} onClose={() => {}} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(screen.getByText(/required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with trimmed values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AddBookModal open submitting={false} onClose={() => {}} onSubmit={onSubmit} />);

    const [titleInput, ownerInput] = screen.getAllByRole("textbox");
    await user.type(titleInput, "  Domain-Driven Design  ");
    await user.type(ownerInput, "  Eric Evans  ");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(onSubmit).toHaveBeenCalledWith("Domain-Driven Design", "Eric Evans");
  });

  it("surfaces an error message when onSubmit throws", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Network down"));
    render(<AddBookModal open submitting={false} onClose={() => {}} onSubmit={onSubmit} />);

    const [titleInput, ownerInput] = screen.getAllByRole("textbox");
    await user.type(titleInput, "X");
    await user.type(ownerInput, "Y");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(await screen.findByText(/network down/i)).toBeInTheDocument();
  });

  it("disables Add while submitting", () => {
    render(<AddBookModal open submitting={true} onClose={() => {}} onSubmit={() => {}} />);
    expect(screen.getByRole("button", { name: /adding/i })).toBeDisabled();
  });
});

import { useState } from "react";

interface Props {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (title: string, owner: string) => Promise<void> | void;
}

// The modal unmounts when `open` is false, so component-local state always
// starts fresh on each open — no reset effect needed.
export function AddBookModal({ open, submitting, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !owner.trim()) {
      setError("Title and Owner are required.");
      return;
    }
    try {
      await onSubmit(title.trim(), owner.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add book.");
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>Add a Book</h2>
        <form onSubmit={handleSubmit}>
          <label>
            <span>Title</span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />
          </label>
          <label>
            <span>Owner</span>
            <input value={owner} onChange={(e) => setOwner(e.target.value)} disabled={submitting} />
          </label>
          {error && <p className="error">{error}</p>}
          <div className="modal__actions">
            <button type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

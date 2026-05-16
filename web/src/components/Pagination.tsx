interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        ‹ Prev
      </button>
      <span>
        {page} of {totalPages}
      </span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        Next ›
      </button>
    </div>
  );
}

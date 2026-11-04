import { ChevronLeft, ChevronRight } from 'lucide-react';
export default function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <div>Page {page} of {pages}</div>
      <div className="flex gap-2">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="btn-secondary"><ChevronLeft size={16} /> Prev</button>
        <button onClick={() => onPage(page + 1)} disabled={page >= pages} className="btn-secondary">Next <ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
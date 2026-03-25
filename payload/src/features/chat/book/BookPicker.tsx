import { useEffect, useState } from "react";
import { fetchBooks } from "@/features/shared/api";
import { useAppDispatch, useAppState } from "@/features/shared/AppContext";

/**
 * BookPicker — pre-session screen (Coze-inspired)
 *
 * User must select ≥1 book before the chat session starts.
 * Once started, books are locked for the entire conversation.
 */
export default function BookPicker() {
  const { books } = useAppState();
  const dispatch = useAppDispatch();
  const [loadingBooks, setLoadingBooks] = useState(books.length === 0);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (books.length > 0) {
      setLoadingBooks(false);
      return;
    }
    fetchBooks()
      .then((b) => {
        dispatch({ type: "SET_BOOKS", books: b });
        setLoadingBooks(false);
      })
      .catch(() => setLoadingBooks(false));
  }, [books.length, dispatch]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startSession() {
    if (selected.size === 0) return;
    dispatch({ type: "START_SESSION", bookIds: [...selected] });
  }

  const canStart = selected.size > 0;

  // Group books by category (authors field)
  const grouped: { category: string; items: typeof books }[] = [];
  const categoryMap = new Map<string, typeof books>();
  for (const book of books) {
    const cat = book.authors || 'Other';
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(book);
  }
  for (const [cat, items] of categoryMap) grouped.push({ category: cat, items });

  const categoryLabel: Record<string, string> = {
    ecdev: 'Economic Development',
    real_estate: 'Real Estate',
    textbook: 'Textbooks',
  };

  return (
    <div className="flex h-full flex-col bg-[#f5f7fb]">
      {/* ── Scrollable body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-10">
          {/* Hero */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 shadow-lg">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Choose your textbooks</h1>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Select one or more books to study. Your selection will be{" "}
              <strong className="font-medium text-slate-700">locked</strong> for this entire conversation.
            </p>
          </div>

          {/* Book list */}
          {loadingBooks ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            </div>
          ) : books.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center text-slate-400">
              <svg className="mx-auto mb-3 h-8 w-8 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              No indexed books found.
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(({ category, items }) => (
                <div key={category}>
                  {/* Category header with select-all */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                        {categoryLabel[category] ?? category}
                      </span>
                      <span className="text-xs text-slate-400">{items.length} books</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = items.every((b) => selected.has(b.id));
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (allSelected) items.forEach((b) => next.delete(b.id));
                          else items.forEach((b) => next.add(b.id));
                          return next;
                        });
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      {items.every((b) => selected.has(b.id)) ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((book) => {
                      const checked = selected.has(book.id);
                      return (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => toggle(book.id)}
                          className={`group flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
                            checked
                              ? "border-slate-900 bg-slate-900"
                              : "border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm"
                          }`}
                        >
                          {/* Checkbox */}
                          <div className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                            checked ? "border-white bg-white" : "border-slate-300 group-hover:border-slate-400"
                          }`}>
                            {checked && (
                              <svg className="h-2.5 w-2.5 text-slate-900" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                            )}
                          </div>
                          {/* Meta */}
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm font-semibold leading-snug ${checked ? "text-white" : "text-slate-900"}`}>
                              {book.title}
                            </div>
                            <div className={`mt-1.5 flex flex-wrap gap-1.5 text-[11px] ${checked ? "text-slate-300" : "text-slate-400"}`}>
                              {book.chunk_count > 0 && (
                                <span className={`rounded px-1.5 py-0.5 ${checked ? "bg-white/10" : "bg-slate-100"}`}>
                                  {book.chunk_count} chunks
                                </span>
                              )}
                              {book.page_count > 0 && (
                                <span className={`rounded px-1.5 py-0.5 ${checked ? "bg-white/10" : "bg-slate-100"}`}>
                                  {book.page_count} pages
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky CTA footer ── */}
      <div className="shrink-0 border-t border-slate-200 bg-white/90 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <div className="flex-1 text-sm text-slate-500">
            {selected.size === 0
              ? "Select at least one book to continue"
              : `${selected.size} book${selected.size > 1 ? 's' : ''} selected`}
          </div>
          <button
            type="button"
            onClick={startSession}
            disabled={!canStart}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
}

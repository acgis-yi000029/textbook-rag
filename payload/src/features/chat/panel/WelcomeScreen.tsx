/**
 * panel/WelcomeScreen.tsx
 * 聊天空状态 — Coze 风格欢迎页 + 建议问题卡片 + Demo 按钮
 */
import type { BookSummary } from "@/features/shared/types";

const ICONS = [
  <svg key="i0" className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M9.75 17.25h4.5M12 3v.75m4.243 1.007-.53.53M20.25 12H21m-3.257 4.243.53.53M3.75 12H3m3.257-4.243-.53-.53M7.757 4.757l-.53-.53" />
  </svg>,
  <svg key="i1" className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
  </svg>,
  <svg key="i2" className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>,
  <svg key="i3" className="h-4 w-4 text-sky-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
  </svg>,
];

interface Props {
  sessionBooks: BookSummary[];
  suggestions: string[];
  loading: boolean;
  onSubmitQuestion: (question: string) => void;
  onRunDemo: () => void;
}

export default function WelcomeScreen({
  sessionBooks,
  suggestions,
  loading,
  onSubmitQuestion,
  onRunDemo,
}: Props) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-8">
      {/* Big avatar + greeting */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4l-3 3-3-3Z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">
            Hi! What would you like to know?
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask anything — answers are grounded in your selected{" "}
            {sessionBooks.length === 1 ? "book" : `${sessionBooks.length} books`}.
          </p>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="grid w-full gap-2 sm:grid-cols-2">
        {suggestions.map((question, index) => (
          <button
            key={question}
            onClick={() => onSubmitQuestion(question)}
            className="group rounded-xl border border-border bg-card px-3 py-3 text-left shadow-sm transition hover:border-foreground/20 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 rounded-md bg-muted p-1.5">
                {ICONS[index % ICONS.length]}
              </span>
              <span className="text-sm text-muted-foreground group-hover:text-foreground">
                {question}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Demo button */}
      <button
        type="button"
        onClick={onRunDemo}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-5 py-3 text-sm font-medium text-primary transition hover:border-primary/50 hover:bg-primary/10 disabled:opacity-50"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
        </svg>
        Demo: FastAPI Dependency Injection
      </button>
    </div>
  );
}

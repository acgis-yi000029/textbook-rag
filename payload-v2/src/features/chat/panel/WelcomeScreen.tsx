/**
 * panel/WelcomeScreen.tsx
 * Chat empty-state — clean greeting + document count.
 * Suggested questions are handled by QuestionsSidebar (right panel).
 */

import type { BookBase } from "@/features/shared/books";
import { useI18n } from "@/features/shared/i18n";
import { tpl } from "@/features/shared/i18n";

interface Props {
  sessionBooks: BookBase[];
  loading: boolean;
  onSubmitQuestion: (question: string) => void;
}

export default function WelcomeScreen({
  sessionBooks,
}: Props) {
  const { t } = useI18n();
  const totalBooks = sessionBooks.length;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-16">
      {/* Icon + Title */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">
            {t.chatWelcomeTitle}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {tpl(t.chatWelcomeBody, { count: totalBooks > 0 ? totalBooks : 'your' })}
          </p>
        </div>
      </div>

      {/* Hint to use sidebar */}
      <p className="text-xs text-muted-foreground/60">
        {t.chatWelcomeHint}
      </p>
    </div>
  );
}

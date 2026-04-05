/**
 * panel/WelcomeScreen.tsx
 * 聊天空状态 — 简洁欢迎界面
 */
import type { BookBase } from "@/features/shared/books";

interface Props {
  sessionBooks: BookBase[];
  loading: boolean;
  onSubmitQuestion: (question: string) => void;
}

export default function WelcomeScreen({
  sessionBooks,
}: Props) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-8">
      {/* Greeting */}
      <div className="flex flex-col items-center gap-3 text-center">
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
    </div>
  );
}

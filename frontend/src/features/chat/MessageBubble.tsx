import type { ReactNode } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import type { SourceInfo } from "../../types/api";
import { useAppDispatch, useAppState } from "../../context/AppContext";

interface Props {
  role: "user" | "assistant";
  content: string;
  sources?: SourceInfo[];
}

function injectCitationLinks(text: string, maxCitation: number): string {
  return text.replace(
    /\[(\d+)\]/g,
    (_, n) => {
      const index = Number.parseInt(n, 10);
      if (index >= 1 && index <= maxCitation) {
        return `[^[${n}]](cite:${n})`;
      }

      return `<span data-invalid-cite="${n}" title="Citation ${n} is not available in this response"><sup>[${n}]</sup></span>`;
    },
  );
}

export default function MessageBubble({ role, content, sources }: Props) {
  const isUser = role === "user";
  const dispatch = useAppDispatch();
  const { currentBookId } = useAppState();

  const handleCitationClick = (index: number) => {
    if (!sources || index < 0 || index >= sources.length) return;
    dispatch({ type: "SELECT_SOURCE", source: sources[index] });
  };

  return (
    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4l-3 3-3-3Z" />
          </svg>
        </div>
      )}

      <div className={`max-w-[86%] ${isUser ? "order-first" : ""}`}>
        <div className={`mb-1 text-[11px] font-medium uppercase tracking-[0.16em] ${isUser ? "text-right text-blue-500" : "text-slate-400"}`}>
          {isUser ? "You" : "Textbook RAG"}
        </div>
        <div
          className={`rounded-[22px] px-4 py-3 text-sm shadow-sm ${
            isUser
              ? "rounded-tr-md bg-blue-600 text-white"
              : "rounded-tl-md border border-slate-200 bg-white/92 text-slate-800"
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap leading-6">{content}</div>
          ) : (
            <Markdown
              rehypePlugins={[rehypeRaw]}
              components={{
                p({ children }) {
                  return <p className="my-2 leading-7 text-slate-700">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="my-2 list-disc space-y-1 pl-5 text-slate-700">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="my-2 list-decimal space-y-1 pl-5 text-slate-700">{children}</ol>;
                },
                li({ children }) {
                  return <li className="leading-7">{children}</li>;
                },
                strong({ children }) {
                  return <strong className="font-semibold text-slate-900">{children}</strong>;
                },
                code({ children }) {
                  return <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.92em] text-slate-800">{children}</code>;
                },
                span({
                  children,
                  ...props
                }: {
                  children?: ReactNode;
                  "data-invalid-cite"?: string;
                  title?: string;
                }) {
                  if (props["data-invalid-cite"]) {
                    return (
                      <span
                        className="inline-flex items-center text-[0.72em] font-semibold text-slate-400 align-super"
                        title={props.title}
                      >
                        {children}
                      </span>
                    );
                  }

                  return <span>{children}</span>;
                },
                a({ href, children }: { href?: string; children?: ReactNode }) {
                  const match = href?.match(/^cite:(\d+)$/);
                  if (match) {
                    const idx = Number.parseInt(match[1], 10) - 1;
                    return (
                      <button
                        type="button"
                        className="inline-flex cursor-pointer items-center border-0 bg-transparent p-0 text-[0.72em] font-semibold text-blue-600 align-super hover:text-blue-800"
                        onClick={() => handleCitationClick(idx)}
                      >
                        {children}
                      </button>
                    );
                  }

                  return (
                    <a href={href} className="text-blue-600 underline decoration-blue-200 underline-offset-2 hover:text-blue-800">
                      {children}
                    </a>
                  );
                },
              }}
            >
              {injectCitationLinks(content, sources?.length ?? 0)}
            </Markdown>
          )}
        </div>
        {!isUser && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Sources: {sources?.length ?? 0}</span>
            {currentBookId && (
              <>
                <span className="text-slate-400">Debug citation:</span>
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-medium text-amber-700 transition hover:bg-amber-100"
                  onClick={() => dispatch({ type: "SET_PAGE", page: 10 })}
                >
                  [p.10]
                </button>
              </>
            )}
            {sources && sources.length > 0 ? (
              <>
                <span className="text-slate-400">Test citation:</span>
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-medium text-blue-700 transition hover:bg-blue-100"
                  onClick={() => handleCitationClick(0)}
                >
                  [1]
                </button>
              </>
            ) : (
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-500">
                No source returned
              </span>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 shadow-sm ring-1 ring-blue-200/70">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a7.5 7.5 0 0 1 15 0A17.933 17.933 0 0 1 12 21.75a17.933 17.933 0 0 1-7.5-1.632Z" />
          </svg>
        </div>
      )}
    </div>
  );
}

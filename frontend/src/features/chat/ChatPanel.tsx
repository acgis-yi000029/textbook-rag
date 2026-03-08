import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { fetchModels, queryTextbook, fetchSuggestions } from "../../api/client";
import { useAppDispatch, useAppState } from "../../context/AppContext";
import type { ModelInfo, QueryResponse, SourceInfo } from "../../types/api";
import MessageBubble from "./MessageBubble";
import SourceCard from "../source/SourceCard";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: SourceInfo[];
}

const FALLBACK_SUGGESTIONS = [
  "What are the main topics covered in this book?",
  "What are the prerequisites for this book?",
  "Summarize the most important takeaways.",
  "What practical examples does this book provide?",
];

const NEAR_BOTTOM_THRESHOLD = 160;

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

function ThreadStatus({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
        Workspace
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
    </div>
  );
}

export default function ChatPanel() {
  const { currentBookId, selectedSource, books, selectedModel } = useAppState();
  const dispatch = useAppDispatch();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(FALLBACK_SUGGESTIONS);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldStickToBottomRef = useRef(true);

  const currentBook = books.find((b) => b.id === currentBookId);
  const hasMessages = messages.length > 0;

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const thread = threadRef.current;
    if (!thread) return;
    thread.scrollTo({ top: thread.scrollHeight, behavior });
    shouldStickToBottomRef.current = true;
    setIsNearBottom(true);
    setHasNewMessagesBelow(false);
  }, []);

  const updateNearBottom = useCallback(() => {
    const thread = threadRef.current;
    if (!thread) return;
    const distanceFromBottom =
      thread.scrollHeight - thread.scrollTop - thread.clientHeight;
    const nextNearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
    shouldStickToBottomRef.current = nextNearBottom;
    setIsNearBottom(nextNearBottom);
    if (nextNearBottom) setHasNewMessagesBelow(false);
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  useEffect(() => {
    fetchModels()
      .then((availableModels) => {
        setModels(availableModels);
        if (
          availableModels.length > 0 &&
          !availableModels.some((model) => model.name === selectedModel)
        ) {
          const preferred =
            availableModels.find((model) => model.is_default) ?? availableModels[0];
          dispatch({ type: "SET_MODEL", model: preferred.name });
        }
      })
      .catch(() => setModels([]));
  }, [dispatch, selectedModel]);

  useEffect(() => {
    if (!currentBookId) {
      setSuggestions(FALLBACK_SUGGESTIONS);
      return;
    }

    fetchSuggestions(currentBookId)
      .then((s) => setSuggestions(s.length ? s : FALLBACK_SUGGESTIONS))
      .catch(() => setSuggestions(FALLBACK_SUGGESTIONS));
  }, [currentBookId]);

  useEffect(() => {
    if (!threadRef.current) return;
    if (!hasMessages) {
      scrollToBottom("auto");
      return;
    }
    if (shouldStickToBottomRef.current) {
      scrollToBottom("smooth");
      return;
    }
    setHasNewMessagesBelow(true);
  }, [hasMessages, loading, messages, scrollToBottom]);

  const submitQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;

      setInput("");
      setError(null);
      shouldStickToBottomRef.current = true;
      setHasNewMessagesBelow(false);
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setLoading(true);

      try {
        const filters = currentBookId ? { book_ids: [currentBookId] } : undefined;
        const res: QueryResponse = await queryTextbook({
          question: trimmed,
          filters,
          model: selectedModel,
          top_k: 5,
        });

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: res.answer, sources: res.sources },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [currentBookId, selectedModel],
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submitQuestion(input);
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    void submitQuestion(input);
  }

  const resetConversation = useCallback(() => {
    setMessages([]);
    setInput("");
    setLoading(false);
    setError(null);
    setHasNewMessagesBelow(false);
    setIsNearBottom(true);
    shouldStickToBottomRef.current = true;
    dispatch({ type: "SELECT_SOURCE", source: null });
    scrollToBottom("auto");
  }, [dispatch, scrollToBottom]);

  const selectedSourceLabel = selectedSource
    ? `${selectedSource.chapter_title ?? selectedSource.book_title} · p.${selectedSource.page_number}`
    : null;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f5f7fb]">
      <div className="border-b border-slate-200 bg-[#f8fafc] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {hasMessages && (
                <button
                  type="button"
                  onClick={resetConversation}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                  title="Back to chat start"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                  </svg>
                  <span>Back</span>
                </button>
              )}
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <h2 className="truncate text-sm font-semibold text-slate-900">
                {currentBook ? currentBook.title : "Textbook RAG"}
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {currentBook
                ? `${currentBook.page_count} pages · ${currentBook.chapter_count} chapters`
                : "Select a textbook to start a conversation"}
            </p>
          </div>
          <div className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {loading ? "Thinking..." : hasMessages ? "Conversation" : "Ready"}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            <span>Model</span>
            <select
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[12px] font-medium normal-case tracking-normal text-slate-700 outline-none transition focus:border-slate-300"
              value={selectedModel}
              onChange={(event) =>
                dispatch({ type: "SET_MODEL", model: event.target.value })
              }
              disabled={loading || models.length === 0}
            >
              {models.length === 0 ? (
                <option value={selectedModel}>{selectedModel}</option>
              ) : (
                models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name}
                    {model.is_default ? " (default)" : ""}
                  </option>
                ))
              )}
            </select>
          </label>
          <span className="text-[11px] text-slate-400">
            Current queries use the selected model only.
          </span>
        </div>

        {selectedSourceLabel && (
          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m0 0 4-4m-4 4-4-4" />
            </svg>
            <span className="truncate">Focused source: {selectedSourceLabel}</span>
          </div>
        )}
      </div>

      <div
        ref={threadRef}
        className="chat-thread relative flex-1 overflow-y-auto px-4 pb-28 pt-4"
        onScroll={updateNearBottom}
      >
        {!hasMessages && !loading ? (
          <div className="mx-auto flex max-w-3xl flex-col gap-4 py-6">
            <ThreadStatus
              title={currentBook ? currentBook.title : "Textbook RAG"}
              subtitle={
                currentBook
                  ? "Ask for explanations, summaries, definitions, or page-grounded evidence."
                  : "Choose a textbook first, then start asking questions."
              }
            />

            <div className="grid gap-2 md:grid-cols-2">
              {suggestions.map((question, index) => (
                <button
                  key={question}
                  onClick={() => void submitQuestion(question)}
                  className="group rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 rounded-md bg-slate-100 p-2">
                      {ICONS[index % ICONS.length]}
                    </span>
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                        Prompt
                      </div>
                      <div className="mt-1 text-sm text-slate-700 group-hover:text-slate-900">
                        {question}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className="space-y-2">
                <MessageBubble
                  role={message.role}
                  content={message.content}
                  sources={message.sources}
                />
                {message.sources && message.sources.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>References</span>
                      <span className="normal-case tracking-normal text-slate-400">
                        Click to jump into the PDF
                      </span>
                    </div>
                    <div className="space-y-2">
                      {message.sources.map((source, sourceIndex) => (
                        <SourceCard
                          key={source.source_id}
                          source={source}
                          index={sourceIndex}
                          isActive={selectedSource?.source_id === source.source_id}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4l-3 3-3-3Z" />
                  </svg>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                    </div>
                    <span className="text-sm text-slate-500">
                      Searching the book and drafting an answer...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {hasNewMessagesBelow && !isNearBottom && (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 flex justify-center px-4">
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="pointer-events-auto rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Jump to latest
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="absolute inset-x-0 bottom-0 border-t border-slate-200 bg-[#f8fafc] px-4 pb-4 pt-3"
      >
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-300 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Message
          </div>
          <div className="flex items-end gap-3 px-4 py-3">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                rows={1}
                className="max-h-[200px] min-h-[28px] w-full resize-none border-0 bg-transparent px-0 py-0.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                placeholder={
                  currentBook
                    ? `Ask about ${currentBook.title}...`
                    : "Select a textbook, then ask a question..."
                }
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleTextareaKeyDown}
                disabled={loading}
              />
              <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                <span>
                  {currentBook
                    ? "Grounded answers use the selected textbook only."
                    : "Pick a book to enable retrieval."}
                </span>
                <span>Enter to send · Shift+Enter for line breaks</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-900 bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-400"
              title="Send message"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

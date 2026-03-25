import type { SourceInfo, QueryTrace } from "@/features/shared/types";

export interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: SourceInfo[];
  trace?: QueryTrace;
}

export const FALLBACK_SUGGESTIONS = [
  "What are the main topics covered in this book?",
  "What are the prerequisites for this book?",
  "Summarize the most important takeaways.",
  "What practical examples does this book provide?",
];

export const NEAR_BOTTOM_THRESHOLD = 160;

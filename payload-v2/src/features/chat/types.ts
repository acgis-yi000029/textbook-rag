import type { SourceInfo, QueryTrace } from "@/features/shared/types";

export interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: SourceInfo[];
  trace?: QueryTrace;
  /** LLM model name that generated this response (assistant messages only). */
  model?: string;
}

export const NEAR_BOTTOM_THRESHOLD = 160;

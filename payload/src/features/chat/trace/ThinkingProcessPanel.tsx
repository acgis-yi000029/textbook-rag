/**
 * trace/ThinkingProcessPanel.tsx
 * 可折叠的"思考过程"面板 — 展示 4 步检索策略 + RRF 融合 + 生成
 */
import type { QueryTrace } from "@/features/shared/types";

const STRATEGY_META: Record<string, { label: string; color: string; desc: string }> = {
  fts:    { label: "FTS5 (BM25)",         color: "text-amber-600 bg-amber-50 border-amber-200",        desc: "Full-text keyword search using SQLite FTS5 with BM25 ranking" },
  vector: { label: "Vector (Embedding)",   color: "text-blue-600 bg-blue-50 border-blue-200",          desc: "Semantic similarity search via ChromaDB embeddings" },
  toc:    { label: "TOC Heading (Tree)",   color: "text-emerald-600 bg-emerald-50 border-emerald-200", desc: "Hierarchical TOC tree traversal with heading-level matching" },
};

export default function ThinkingProcessPanel({ trace }: { trace: QueryTrace }) {
  const strategies = [
    { key: "fts",    hits: trace.retrieval.fts_results ?? [] },
    { key: "vector", hits: trace.retrieval.vector_results ?? [] },
    { key: "toc",    hits: trace.retrieval.toc_results ?? [] },
  ];
  const fusedResults = trace.retrieval.fused_results ?? [];
  const fusedCount = fusedResults.length;

  return (
    <details className="rounded-xl border border-border bg-card shadow-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-foreground select-none">
        <svg className="h-4 w-4 text-muted-foreground transition-transform [[open]>&]:rotate-90" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
        </svg>
        <span>Thinking Process</span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {strategies.length} strategies → {fusedCount} fused chunks
        </span>
      </summary>

      <div className="space-y-4 border-t border-border p-4">
        {/* Step 1: Query Analysis */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Query Analysis</span>
          </div>
          <div className="ml-7 rounded-lg border border-border bg-muted/50 px-3 py-2">
            <div className="text-[11px] font-medium text-muted-foreground">Generated FTS Query</div>
            <code className="text-sm text-foreground">{trace.retrieval.fts_query}</code>
          </div>
        </div>

        {/* Step 2: Multi-Strategy Retrieval */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">2</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Multi-Strategy Retrieval</span>
          </div>
          <div className="ml-7 grid gap-2 md:grid-cols-2">
            {strategies.map(({ key, hits }) => {
              const meta = STRATEGY_META[key];
              return (
                <div key={key} className={`rounded-lg border p-3 ${meta.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{meta.label}</span>
                    <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-bold">
                      {hits.length} hits
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] opacity-75">{meta.desc}</div>
                  {hits.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {hits.map((hit) => (
                        <div key={`${key}-${hit.chunk_id}-${hit.rank}`} className="flex items-center justify-between rounded bg-background/60 px-2 py-1 text-[11px]">
                          <span className="truncate">p.{hit.page_number} — {hit.snippet.slice(0, 50)}…</span>
                          <span className="ml-2 shrink-0 font-mono font-semibold">
                            {hit.score != null ? hit.score.toFixed(3) : "n/a"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: RRF Fusion */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">3</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RRF Fusion</span>
            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-500">Best {fusedCount} selected</span>
          </div>
          <div className="ml-7 space-y-1">
            {fusedResults.map((hit) => (
              <div key={`fused-${hit.chunk_id}-${hit.rank}`} className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {hit.rank}
                </span>
                <span className="min-w-0 flex-1 truncate text-foreground">
                  p.{hit.page_number} — {hit.snippet.slice(0, 80)}…
                </span>
                <span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground">
                  {hit.score != null ? hit.score.toFixed(4) : "n/a"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 4: Generation */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">4</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Answer Generation</span>
          </div>
          <div className="ml-7 flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground">
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{trace.generation.model}</span>
            <span className="text-muted-foreground">{fusedCount} context chunks → structured answer with citations</span>
          </div>
        </div>
      </div>
    </details>
  );
}

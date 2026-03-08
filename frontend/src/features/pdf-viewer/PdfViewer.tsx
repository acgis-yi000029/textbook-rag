import {
  memo,
  startTransition,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";

import { getPdfUrl, fetchToc } from "../../api/client";
import { useAppState, useAppDispatch } from "../../context/AppContext";
import BboxOverlay from "./BboxOverlay";
import Loading from "../../components/Loading";
import ResizeHandle from "../../components/ResizeHandle";
import type { TocEntry } from "../../types/api";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const HORIZONTAL_GUTTER = 32;
const PAGE_GAP = 20;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const VIEWPORT_VERTICAL_PADDING = 40;
const INITIAL_RENDER_RADIUS = 2;
const VISIBLE_RENDER_RADIUS = 3;

interface PdfPageCanvasProps {
  pageNumber: number;
  renderWidth: number;
  onPageLoadSuccess: (pageNumber: number, dims: { width: number; height: number }) => void;
}

const PdfPageCanvas = memo(function PdfPageCanvas({
  pageNumber,
  renderWidth,
  onPageLoadSuccess,
}: PdfPageCanvasProps) {
  const handleLoadSuccess = useCallback(
    (page: { width: number; height: number }) => {
      onPageLoadSuccess(pageNumber, { width: page.width, height: page.height });
    },
    [onPageLoadSuccess, pageNumber],
  );

  return (
    <Page
      pageNumber={pageNumber}
      width={renderWidth}
      onLoadSuccess={handleLoadSuccess}
      loading={<Loading />}
      renderTextLayer={false}
      renderAnnotationLayer={false}
    />
  );
});

export default function PdfViewer() {
  const {
    currentBookId,
    currentPage,
    selectedSource,
    selectedSourceNonce,
    pdfVariant,
    showToc,
  } =
    useAppState();
  const dispatch = useAppDispatch();

  const [numPages, setNumPages] = useState(0);
  const [pageDimsByPage, setPageDimsByPage] = useState<
    Record<number, { width: number; height: number }>
  >({});
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);
  const [tocWidth, setTocWidth] = useState(260);
  const [renderWidth, setRenderWidth] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [isViewerHovered, setIsViewerHovered] = useState(false);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set([1]));
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());

  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const pageFrameRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef(new Map<number, HTMLDivElement>());
  const bboxRefs = useRef(new Map<number, HTMLDivElement>());
  const currentPageRef = useRef(currentPage);
  const skipNextScrollRef = useRef(false);
  const didFitPageRef = useRef(false);
  const pendingPageJumpRef = useRef<{
    pageNumber: number;
    nonce: number;
  } | null>(null);
  const pendingSourceScrollRef = useRef<{
    pageNumber: number;
    hasBbox: boolean;
    nonce: number;
  } | null>(null);

  const hasToc = tocEntries.length > 0;

  const pdfUrl = useMemo(
    () => (currentBookId ? getPdfUrl(currentBookId, pdfVariant) : ""),
    [currentBookId, pdfVariant],
  );

  const pageNumbers = useMemo(
    () => Array.from({ length: numPages }, (_, index) => index + 1),
    [numPages],
  );

  const markPagesRendered = useCallback((centerPage: number, radius: number) => {
    setRenderedPages((prev) => {
      const next = new Set(prev);
      const start = Math.max(1, centerPage - radius);
      const end = Math.min(numPages || centerPage + radius, centerPage + radius);

      for (let page = start; page <= end; page += 1) {
        next.add(page);
      }

      return next;
    });
  }, [numPages]);

  const setPageNode = useCallback((pageNumber: number, node: HTMLDivElement | null) => {
    if (node) {
      pageRefs.current.set(pageNumber, node);
      return;
    }

    pageRefs.current.delete(pageNumber);
  }, []);

  const setBboxNode = useCallback((pageNumber: number, node: HTMLDivElement | null) => {
    if (node) {
      bboxRefs.current.set(pageNumber, node);
      return;
    }

    bboxRefs.current.delete(pageNumber);
  }, []);

  const clampZoom = useCallback((value: number) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
  }, []);

  const applyZoom = useCallback(
    (delta: number) => {
      setZoomScale((prev) => clampZoom(prev + delta));
    },
    [clampZoom],
  );

  const resetZoom = useCallback(() => {
    setZoomScale(1);
  }, []);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    if (!currentBookId) {
      setTocEntries([]);
      return;
    }

    setPageDimsByPage({});
    setNumPages(0);
    setRenderWidth(0);
    setZoomScale(1);
    setRenderedPages(new Set([1]));
    setLoadedPages(new Set());
    pageRefs.current.clear();
    bboxRefs.current.clear();
    didFitPageRef.current = false;
    pendingPageJumpRef.current = null;
    pendingSourceScrollRef.current = null;

    fetchToc(currentBookId).then(setTocEntries).catch(() => setTocEntries([]));
  }, [currentBookId, pdfVariant]);

  useEffect(() => {
    if (renderWidth > 0) return;

    const node = pageFrameRef.current;
    if (!node) return;

    const updateWidth = () => {
      const next = Math.max(0, Math.floor(node.clientWidth - HORIZONTAL_GUTTER));
      if (next > 0) {
        setRenderWidth(next);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(node);

    return () => observer.disconnect();
  }, [hasToc, renderWidth, showToc, tocWidth]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport || pageNumbers.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestPage: number | null = null;
        let bestRatio = 0;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const pageNumber = Number((entry.target as HTMLElement).dataset.pageNumber);
          startTransition(() => {
            markPagesRendered(pageNumber, VISIBLE_RENDER_RADIUS);
          });
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestPage = pageNumber;
          }
        }

        if (
          bestPage !== null &&
          pendingPageJumpRef.current &&
          bestPage !== pendingPageJumpRef.current.pageNumber
        ) {
          return;
        }

        if (bestPage !== null && bestPage !== currentPageRef.current) {
          skipNextScrollRef.current = true;
          dispatch({ type: "SET_PAGE", page: bestPage });
        }
      },
      {
        root: viewport,
        threshold: [0.25, 0.5, 0.75],
        rootMargin: "-15% 0px -35% 0px",
      },
    );

    for (const pageNumber of pageNumbers) {
      const node = pageRefs.current.get(pageNumber);
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [dispatch, markPagesRendered, pageNumbers]);

  useEffect(() => {
    if (numPages === 0) return;

    startTransition(() => {
      markPagesRendered(currentPage, INITIAL_RENDER_RADIUS);
    });
  }, [currentPage, markPagesRendered, numPages]);

  useEffect(() => {
    const target = pageRefs.current.get(currentPage);
    if (!target) return;

    if (
      skipNextScrollRef.current &&
      pendingPageJumpRef.current?.pageNumber !== currentPage
    ) {
      skipNextScrollRef.current = false;
      return;
    }

    target.scrollIntoView({
      block: "start",
      inline: "nearest",
      behavior: "smooth",
    });

    if (pendingPageJumpRef.current?.pageNumber === currentPage) {
      window.setTimeout(() => {
        if (pendingPageJumpRef.current?.pageNumber === currentPage) {
          pendingPageJumpRef.current = null;
        }
      }, 250);
    }
  }, [currentPage]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;

      const viewport = scrollViewportRef.current;
      const activeElement = document.activeElement;
      const isActiveInViewer =
        viewport !== null &&
        activeElement instanceof Node &&
        viewport.contains(activeElement);

      if (!isViewerHovered && !isActiveInViewer) return;

      if (event.key === "0") {
        event.preventDefault();
        resetZoom();
        return;
      }

      if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        applyZoom(ZOOM_STEP);
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        applyZoom(-ZOOM_STEP);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [applyZoom, isViewerHovered, resetZoom]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      if (!isViewerHovered) return;

      event.preventDefault();
      applyZoom(event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [applyZoom, isViewerHovered]);

  useEffect(() => {
    if (!selectedSource) return;
    if (selectedSource.book_id !== currentBookId) return;

    pendingSourceScrollRef.current = {
      pageNumber: selectedSource.page_number,
      hasBbox: Boolean(selectedSource.bbox),
      nonce: selectedSourceNonce,
    };
    pendingPageJumpRef.current = {
      pageNumber: selectedSource.page_number,
      nonce: selectedSourceNonce,
    };
    skipNextScrollRef.current = false;
    startTransition(() => {
      markPagesRendered(selectedSource.page_number, VISIBLE_RENDER_RADIUS);
    });
  }, [
    currentBookId,
    markPagesRendered,
    selectedSource,
    selectedSource?.bbox,
    selectedSource?.book_id,
    selectedSource?.page_number,
    selectedSourceNonce,
  ]);

  useEffect(() => {
    const pending = pendingSourceScrollRef.current;
    if (!pending) return;

    const pageNode = pageRefs.current.get(pending.pageNumber);
    if (!pageNode) return;

    pageNode.scrollIntoView({
      block: "start",
      inline: "nearest",
      behavior: "smooth",
    });

    if (!pending.hasBbox) {
      pendingSourceScrollRef.current = null;
    }
  }, [
    currentPage,
    numPages,
    renderedPages,
    selectedSourceNonce,
  ]);

  useEffect(() => {
    if (!selectedSource?.bbox) return;
    if (selectedSource.book_id !== currentBookId) return;

    const bboxNode = bboxRefs.current.get(selectedSource.page_number);
    if (!bboxNode) return;

    bboxNode.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
    pendingSourceScrollRef.current = null;
  }, [
    currentBookId,
    loadedPages,
    selectedSource?.bbox,
    selectedSource?.book_id,
    selectedSource?.page_number,
    selectedSource?.source_id,
    selectedSourceNonce,
    zoomScale,
  ]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: totalPages }: { numPages: number }) => {
      setNumPages(totalPages);
    },
    [],
  );

  const onPageLoadSuccess = useCallback(
    (pageNumber: number, { width, height }: { width: number; height: number }) => {
      setLoadedPages((prev) => {
        if (prev.has(pageNumber)) return prev;
        const next = new Set(prev);
        next.add(pageNumber);
        return next;
      });

      setPageDimsByPage((prev) => {
        const existing = prev[pageNumber];
        if (existing && existing.width === width && existing.height === height) {
          return prev;
        }

        return {
          ...prev,
          [pageNumber]: { width, height },
        };
      });

      if (
        pageNumber === 1 &&
        !didFitPageRef.current &&
        scrollViewportRef.current &&
        pageFrameRef.current
      ) {
        const availableWidth = Math.max(
          0,
          Math.floor(pageFrameRef.current.clientWidth - HORIZONTAL_GUTTER),
        );
        const availableHeight = Math.max(
          0,
          Math.floor(scrollViewportRef.current.clientHeight - VIEWPORT_VERTICAL_PADDING),
        );
        const fitPageWidth = Math.floor((availableHeight * width) / height);
        const nextWidth = Math.max(320, Math.min(availableWidth, fitPageWidth));

        if (nextWidth > 0) {
          didFitPageRef.current = true;
          setRenderWidth(nextWidth);
        }
      }
    },
    [],
  );

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && (!numPages || page <= numPages)) {
        dispatch({ type: "SET_PAGE", page });
      }
    },
    [dispatch, numPages],
  );

  if (!currentBookId) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400 text-sm">
        Select a textbook to view its PDF
      </div>
    );
  }

  const stableRenderWidth = renderWidth > 0 ? renderWidth : 800;
  const estimatedPageHeight =
    pageDimsByPage[1] && stableRenderWidth
      ? Math.round(
          (pageDimsByPage[1].height / pageDimsByPage[1].width) * stableRenderWidth,
        )
      : Math.round(stableRenderWidth * 1.33);
  const scaledPageGap = Math.max(12, Math.round(PAGE_GAP * zoomScale));

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center gap-2 border-b bg-gray-50 px-3 py-2 text-sm">
        {hasToc && (
          <button
            className="rounded px-2 py-1 hover:bg-gray-200"
            onClick={() => dispatch({ type: "TOGGLE_TOC" })}
            title="Toggle table of contents"
          >
            ☰
          </button>
        )}
        <button
          className="rounded px-2 py-1 hover:bg-gray-200 disabled:opacity-40"
          disabled={currentPage <= 1}
          onClick={() => goToPage(currentPage - 1)}
        >
          ◀
        </button>
        <span>
          Page{" "}
          <input
            type="number"
            className="w-14 rounded border px-1 text-center"
            min={1}
            max={numPages || undefined}
            value={currentPage}
            onChange={(event) => goToPage(Number(event.target.value))}
          />{" "}
          / {numPages || "…"}
        </span>
        <button
          className="rounded px-2 py-1 hover:bg-gray-200 disabled:opacity-40"
          disabled={numPages > 0 && currentPage >= numPages}
          onClick={() => goToPage(currentPage + 1)}
        >
          ▶
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
            Fit to width
          </span>
          <button
            className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-300"
            onClick={() => applyZoom(-ZOOM_STEP)}
            title="Zoom out"
          >
            −
          </button>
          <button
            className="min-w-[3.5rem] rounded bg-gray-200 px-2 py-0.5 text-center text-xs text-gray-700 hover:bg-gray-300"
            onClick={resetZoom}
            title="Reset zoom"
          >
            {Math.round(zoomScale * 100)}%
          </button>
          <button
            className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-300"
            onClick={() => applyZoom(ZOOM_STEP)}
            title="Zoom in"
          >
            +
          </button>
          <span className="mx-1 text-gray-300">|</span>
          <span className="text-gray-500 text-xs">PDF:</span>
          <button
            className={`rounded px-2 py-0.5 text-xs ${pdfVariant === "origin" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            onClick={() =>
              dispatch({ type: "SET_PDF_VARIANT", variant: "origin" })
            }
          >
            Original
          </button>
          <button
            className={`rounded px-2 py-0.5 text-xs ${pdfVariant === "layout" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            onClick={() =>
              dispatch({ type: "SET_PDF_VARIANT", variant: "layout" })
            }
          >
            Layout
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {hasToc && showToc && (
          <>
            <div
              className="shrink-0 overflow-y-auto bg-white p-2 text-xs"
              style={{ width: tocWidth }}
            >
              <div className="mb-2 font-semibold text-gray-700">Contents</div>
              {tocEntries.map((entry) => {
                const indent = entry.level * 12;
                const isBold = entry.level <= 1;
                const isActive = entry.pdf_page === currentPage;
                const label = entry.number
                  ? `${entry.number} ${entry.title}`
                  : entry.title;

                return (
                  <button
                    key={entry.id}
                    className={`block w-full truncate rounded py-0.5 pr-1 text-left hover:bg-blue-50 ${
                      isActive
                        ? "bg-blue-100 font-medium text-blue-700"
                        : "text-gray-600"
                    } ${isBold ? "font-semibold" : ""}`}
                    style={{ paddingLeft: `${indent + 8}px` }}
                    title={label}
                    onClick={() => goToPage(entry.pdf_page)}
                  >
                    {label}
                    <span className="ml-1 font-normal text-gray-400">
                      {entry.pdf_page}
                    </span>
                  </button>
                );
              })}
            </div>
            <ResizeHandle
              width={tocWidth}
              onResize={setTocWidth}
              min={160}
              max={500}
            />
          </>
        )}

        <div
          ref={scrollViewportRef}
          className="min-h-0 flex-1 overflow-y-auto bg-gray-200 outline-none"
          tabIndex={0}
          onMouseEnter={() => setIsViewerHovered(true)}
          onMouseLeave={() => setIsViewerHovered(false)}
          onMouseDown={(event) => event.currentTarget.focus()}
        >
          <div
            ref={pageFrameRef}
            className="flex min-h-full justify-center px-4 py-5"
          >
            <Document
              key={pdfUrl}
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<Loading />}
              error={
                <div className="p-4 text-sm text-red-600">Failed to load PDF.</div>
              }
            >
              <div className="flex flex-col items-center" style={{ gap: scaledPageGap }}>
                {pageNumbers.map((pageNumber) => {
                  const pageDims = pageDimsByPage[pageNumber];
                  const bbox = selectedSource?.bbox ?? null;
                  const shouldRenderPage = renderedPages.has(pageNumber);
                  const isPageLoaded = loadedPages.has(pageNumber);
                  const renderedHeight = pageDims
                    ? Math.round(
                        (pageDims.height / pageDims.width) * stableRenderWidth,
                      )
                    : estimatedPageHeight;
                  const showBbox =
                    bbox &&
                    shouldRenderPage &&
                    selectedSource &&
                    selectedSource.book_id === currentBookId &&
                    selectedSource.page_number === pageNumber;
                  const scaledWidth = Math.round(stableRenderWidth * zoomScale);
                  const scaledHeight = renderedHeight
                    ? Math.round(renderedHeight * zoomScale)
                    : undefined;

                  return (
                    <div
                      key={pageNumber}
                      ref={(node) => setPageNode(pageNumber, node)}
                      data-page-number={pageNumber}
                      className={`relative transition-shadow ${
                        pageNumber === currentPage ? "z-10" : ""
                      }`}
                      style={{
                        width: scaledWidth,
                        minHeight: scaledHeight,
                      }}
                    >
                      <div
                        className="absolute left-0 top-0"
                        style={{
                          width: stableRenderWidth,
                          transform: `scale(${zoomScale})`,
                          transformOrigin: "top left",
                        }}
                      >
                          <div
                            className={`relative rounded bg-white shadow-sm ${
                              pageNumber === currentPage
                                ? "shadow-md ring-1 ring-blue-200"
                                : ""
                            }`}
                            style={{ width: stableRenderWidth }}
                          >
                            <div
                              className={`absolute inset-0 rounded bg-gradient-to-br from-slate-100 via-white to-slate-100 transition-opacity duration-500 ${
                                isPageLoaded ? "opacity-0" : "opacity-100"
                              }`}
                            />
                            {shouldRenderPage ? (
                              <div
                                className={`relative transition-all duration-500 ${
                                  isPageLoaded
                                    ? "opacity-100 blur-0"
                                    : "opacity-0 blur-[2px]"
                                }`}
                              >
                                <PdfPageCanvas
                                  pageNumber={pageNumber}
                                  renderWidth={stableRenderWidth}
                                  onPageLoadSuccess={onPageLoadSuccess}
                                />
                              </div>
                            ) : (
                              <div
                                className="relative overflow-hidden rounded bg-gradient-to-br from-slate-100 via-white to-slate-100"
                                style={{ height: renderedHeight }}
                              >
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                  Page {pageNumber}
                                </div>
                              </div>
                            )}
                            <div className="pointer-events-none absolute right-3 top-3 rounded bg-white/85 px-2 py-0.5 text-[11px] font-medium text-gray-500 shadow-sm">
                              {pageNumber}
                            </div>
                            {showBbox && pageDims && renderedHeight && (
                              <BboxOverlay
                                bbox={bbox}
                                pageWidth={pageDims.width}
                                pageHeight={pageDims.height}
                                renderedWidth={stableRenderWidth}
                                renderedHeight={renderedHeight}
                                overlayRef={(node) => setBboxNode(pageNumber, node)}
                              />
                            )}
                          </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
}

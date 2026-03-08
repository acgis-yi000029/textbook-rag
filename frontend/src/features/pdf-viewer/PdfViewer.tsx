import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import { getPdfUrl, fetchToc } from "../../api/client";
import { useAppState, useAppDispatch } from "../../context/AppContext";
import BboxOverlay from "./BboxOverlay";
import Loading from "../../components/Loading";
import ResizeHandle from "../../components/ResizeHandle";
import type { TocEntry } from "../../types/api";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const HORIZONTAL_GUTTER = 32;

export default function PdfViewer() {
  const { currentBookId, currentPage, selectedSource, pdfVariant, showToc } =
    useAppState();
  const dispatch = useAppDispatch();

  const [numPages, setNumPages] = useState<number>(0);
  const [pageDims, setPageDims] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);
  const [tocWidth, setTocWidth] = useState(260);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const pageFrameRef = useRef<HTMLDivElement>(null);
  const bboxRef = useRef<HTMLDivElement>(null);

  const hasToc = tocEntries.length > 0;

  const pdfUrl = useMemo(
    () => (currentBookId ? getPdfUrl(currentBookId, pdfVariant) : ""),
    [currentBookId, pdfVariant],
  );

  useEffect(() => {
    if (!currentBookId) {
      setTocEntries([]);
      return;
    }

    setPageDims(null);
    setNumPages(0);
    fetchToc(currentBookId).then(setTocEntries).catch(() => setTocEntries([]));
  }, [currentBookId, pdfVariant]);

  useEffect(() => {
    const node = pageFrameRef.current;
    if (!node) return;

    const updateWidth = () => {
      setContainerWidth((prev) => {
        const next = Math.max(0, Math.floor(node.clientWidth - HORIZONTAL_GUTTER));
        return prev === next ? prev : next;
      });
    };

    updateWidth();

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(node);

    return () => observer.disconnect();
  }, [hasToc, showToc, tocWidth]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    viewport.scrollTo({ top: 0, behavior: "auto" });
  }, [currentBookId, currentPage, pdfVariant]);

  useEffect(() => {
    if (!showBbox || !bboxRef.current) return;

    bboxRef.current.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [currentPage, selectedSource?.source_id, containerWidth, pageDims]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: totalPages }: { numPages: number }) => setNumPages(totalPages),
    [],
  );

  const onPageLoadSuccess = useCallback(
    ({ width, height }: { width: number; height: number }) => {
      setPageDims((prev) =>
        prev && prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    },
    [],
  );

  if (!currentBookId) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400 text-sm">
        Select a textbook to view its PDF
      </div>
    );
  }

  const showBbox =
    selectedSource &&
    selectedSource.book_id === currentBookId &&
    selectedSource.page_number === currentPage &&
    selectedSource.bbox;

  const goToPage = (page: number) => {
    if (page >= 1 && (!numPages || page <= numPages)) {
      dispatch({ type: "SET_PAGE", page });
    }
  };

  const pageWidth = containerWidth > 0 ? containerWidth : 800;
  const pageHeight =
    pageDims && pageWidth
      ? Math.round((pageDims.height / pageDims.width) * pageWidth)
      : undefined;

  return (
    <div className="flex h-full flex-col">
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
            onChange={(e) => goToPage(Number(e.target.value))}
          />{" "}
          / {numPages || "…"}
        </span>
        <button
          className="rounded px-2 py-1 hover:bg-gray-200 disabled:opacity-40"
          disabled={currentPage >= numPages}
          onClick={() => goToPage(currentPage + 1)}
        >
          ▶
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
            Fit to width
          </span>
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
          className="min-h-0 flex-1 overflow-y-auto bg-gray-200"
        >
          <div
            ref={pageFrameRef}
            className="flex min-h-full justify-center px-4 py-5"
          >
            <div
              className="relative rounded bg-white shadow-sm"
              style={pageWidth ? { width: pageWidth } : undefined}
            >
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<Loading />}
                error={
                  <div className="p-4 text-sm text-red-600">
                    Failed to load PDF.
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  width={pageWidth}
                  onLoadSuccess={onPageLoadSuccess}
                  loading={<Loading />}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
              {showBbox && pageDims && pageHeight && selectedSource.bbox && (
                <BboxOverlay
                  bbox={selectedSource.bbox}
                  pageWidth={pageDims.width}
                  pageHeight={pageDims.height}
                  renderedWidth={pageWidth}
                  renderedHeight={pageHeight}
                  overlayRef={bboxRef}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

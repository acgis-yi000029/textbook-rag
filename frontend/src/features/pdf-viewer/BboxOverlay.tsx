import type { Ref } from "react";

interface Props {
  bbox: { x0: number; y0: number; x1: number; y1: number };
  pageWidth: number;
  pageHeight: number;
  renderedWidth: number;
  renderedHeight: number;
  overlayRef?: Ref<HTMLDivElement>;
}

export default function BboxOverlay({
  bbox,
  pageWidth,
  pageHeight,
  renderedWidth,
  renderedHeight,
  overlayRef,
}: Props) {
  const scaleX = renderedWidth / pageWidth;
  const scaleY = renderedHeight / pageHeight;

  const style: React.CSSProperties = {
    position: "absolute",
    left: bbox.x0 * scaleX,
    top: bbox.y0 * scaleY,
    width: (bbox.x1 - bbox.x0) * scaleX,
    height: (bbox.y1 - bbox.y0) * scaleY,
    border: "2px solid rgba(59, 130, 246, 0.7)",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    pointerEvents: "none",
    borderRadius: 2,
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.12), 0 0 24px rgba(59, 130, 246, 0.18)",
  };

  return <div ref={overlayRef} className="animate-pulse" style={style} />;
}

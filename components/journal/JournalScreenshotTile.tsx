"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  url: string;
  onRemove?: () => void;
  /** Hide remove control */
  removeDisabled?: boolean;
  /** Modal layout = shorter tile */
  variant?: "default" | "compact";
};

export function JournalScreenshotTile({
  url,
  onRemove,
  removeDisabled,
  variant = "default",
}: Props) {
  const [lightbox, setLightbox] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.();
    },
    [onRemove]
  );

  const tileMin =
    variant === "compact"
      ? "min-h-[min(38vh,340px)]"
      : "min-h-[min(48vh,560px)] sm:min-h-[min(50vh,600px)]";
  const imgMax =
    variant === "compact"
      ? "max-h-[min(52vh,520px)]"
      : "max-h-[min(78vh,900px)]";

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label="View screenshot full size"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setLightbox(true);
          }
        }}
        onClick={() => setLightbox(true)}
        className={`group relative flex w-full ${tileMin} cursor-zoom-in items-center justify-center overflow-hidden rounded-xl border-2 border-white/40 bg-[#070708] p-0.5 shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-2 ring-[#6366f1]/30`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className={`${imgMax} w-full object-contain object-top`}
        />
        {!removeDisabled && onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 bg-black/90 text-white shadow-lg transition hover:bg-black sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Remove screenshot"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {lightbox ? (
              <motion.div
                key="journal-screenshot-lightbox"
                className="fixed inset-0 z-[2147483000] flex items-center justify-center bg-black/93 p-3 backdrop-blur-md"
                style={{ isolation: "isolate" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLightbox(false)}
              >
                <button
                  type="button"
                  aria-label="Close"
                  className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  onClick={() => setLightbox(false)}
                >
                  <X className="h-5 w-5" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <motion.img
                  initial={{ scale: 0.97, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.97, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  src={url}
                  alt=""
                  className="relative z-[1] max-h-[96vh] max-w-[96vw] object-contain shadow-2xl ring-1 ring-white/20"
                  onClick={(e) => e.stopPropagation()}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

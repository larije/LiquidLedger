"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
  preventClose?: boolean;
}

const sizes = {
  sm: "max-w-[420px]",
  md: "max-w-[500px]",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  footer,
  preventClose = false,
}: ModalProps) {
  // Track mounted (DOM present) and exiting (playing out-animation)
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Drive mounting/unmounting with an exit animation
  useEffect(() => {
    if (open) {
      setExiting(false);
      setMounted(true);
    } else if (mounted) {
      setExiting(true);
      const t = setTimeout(() => {
        setMounted(false);
        setExiting(false);
      }, 240);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ESC key
  useEffect(() => {
    if (!mounted || preventClose) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mounted, onClose, preventClose]);

  // Focus trap
  useEffect(() => {
    if (!mounted || exiting) return;
    const el = dialogRef.current;
    if (!el) return;
    const nodes = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = nodes[0];
    const last  = nodes[nodes.length - 1];
    const trap  = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", trap);
    // Small delay so the animation has started before we steal focus
    const id = setTimeout(() => first?.focus(), 50);
    return () => { document.removeEventListener("keydown", trap); clearTimeout(id); };
  }, [mounted, exiting]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={preventClose ? undefined : onClose}
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm",
          exiting
            ? "animate-[modal-overlay-enter_240ms_ease_reverse_forwards]"
            : "animate-[modal-overlay-enter_220ms_ease_forwards]",
        )}
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative bg-white rounded-2xl w-full overflow-hidden",
          "shadow-[0_24px_56px_-12px_rgba(0,0,0,0.22),0_8px_20px_-6px_rgba(0,0,0,0.10)]",
          exiting
            ? "animate-[modal-exit_240ms_cubic-bezier(0.4,0,1,1)_forwards]"
            : "animate-[modal-enter_320ms_cubic-bezier(0.34,1.56,0.64,1)_forwards]",
          sizes[size],
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2
            id="modal-title"
            className="font-semibold text-gray-900 text-[15px] leading-snug"
          >
            {title}
          </h2>
          {!preventClose && (
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-xl",
                "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                "transition-colors cursor-pointer",
              )}
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[72vh] overflow-y-auto">
          {children}
        </div>

        {/* Optional footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

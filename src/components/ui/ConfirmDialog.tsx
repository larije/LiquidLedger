"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfirmOptions {
  /** Modal heading */
  title: string;
  /** Primary explanatory text */
  message: string;
  /** Optional secondary note (e.g. "This action cannot be undone.") */
  details?: string;
  /**
   * danger  → red trash icon, red confirm button (permanent deletion)
   * warning → amber warning icon, primary confirm button (advisory)
   */
  variant?: "danger" | "warning";
  /** Label for the confirm button. If omitted, only the cancel button is shown. */
  confirmLabel?: string;
  cancelLabel?: string;
}

type Resolver = (value: boolean) => void;

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ConfirmContext = createContext<ConfirmContextValue>({
  confirm: () => Promise.resolve(false),
});

export function useConfirm() { return useContext(ConfirmContext); }

// ─── Dialog panel ─────────────────────────────────────────────────────────────

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function ConfirmPanel({
  options,
  exiting,
  onResolve,
}: {
  options: ConfirmOptions;
  exiting: boolean;
  onResolve: (result: boolean) => void;
}) {
  const panelRef  = useRef<HTMLDivElement>(null);
  const isDanger  = options.variant === "danger";
  const isWarning = !isDanger; // default is warning style
  const Icon      = isDanger ? Trash2 : AlertTriangle;

  // Focus management — focus cancel button (safest default for destructive dialogs)
  useEffect(() => {
    if (exiting) return;
    const el = panelRef.current;
    if (!el) return;
    const id = setTimeout(() => {
      const buttons = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      // Focus the last button — cancel is first, confirm is last; we want cancel
      buttons[0]?.focus();
    }, 60);
    return () => clearTimeout(id);
  }, [exiting]);

  // Focus trap
  useEffect(() => {
    if (exiting) return;
    const el = panelRef.current;
    if (!el) return;
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = nodes[0];
      const last  = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [exiting]);

  // ESC → cancel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onResolve(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onResolve]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => onResolve(false)}
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm",
          exiting
            ? "animate-[modal-overlay-enter_240ms_ease_reverse_forwards]"
            : "animate-[modal-overlay-enter_220ms_ease_forwards]",
        )}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className={cn(
          "relative bg-white rounded-2xl w-full max-w-[440px] overflow-hidden",
          "shadow-[0_24px_56px_-12px_rgba(0,0,0,0.22),0_8px_20px_-6px_rgba(0,0,0,0.10)]",
          exiting
            ? "animate-[modal-exit_240ms_cubic-bezier(0.4,0,1,1)_forwards]"
            : "animate-[modal-enter_320ms_cubic-bezier(0.34,1.56,0.64,1)_forwards]",
        )}
      >
        {/* Top-right close */}
        <button
          onClick={() => onResolve(false)}
          aria-label="Close"
          className={cn(
            "absolute top-4 right-4 w-8 h-8 flex items-center justify-center",
            "rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100",
            "transition-colors cursor-pointer",
          )}
        >
          <X size={14} strokeWidth={2.5} />
        </button>

        <div className="px-7 pt-8 pb-7">
          {/* Icon badge */}
          <div
            className={cn(
              "w-[60px] h-[60px] rounded-2xl flex items-center justify-center mx-auto mb-5",
              isDanger  ? "bg-red-50"   : "bg-amber-50",
            )}
          >
            <Icon
              size={26}
              className={isDanger ? "text-red-500" : "text-amber-500"}
            />
          </div>

          {/* Text block */}
          <div className="text-center mb-7">
            <h3
              id="confirm-title"
              className="text-[17px] font-semibold text-gray-900 mb-2 leading-snug"
            >
              {options.title}
            </h3>
            <p
              id="confirm-message"
              className="text-sm text-gray-600 leading-relaxed"
            >
              {options.message}
            </p>
            {options.details && (
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {options.details}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => onResolve(false)}
            >
              {options.cancelLabel ?? "Cancel"}
            </Button>

            {options.confirmLabel && (
              <Button
                variant={isDanger ? "danger" : "primary"}
                className="flex-1"
                onClick={() => onResolve(true)}
              >
                {options.confirmLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface DialogState {
  options: ConfirmOptions;
  exiting: boolean;
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog]   = useState<DialogState | null>(null);
  const resolverRef           = useRef<Resolver | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setDialog({ options, exiting: false });
    });
  }, []);

  const resolve = useCallback((result: boolean) => {
    // Play exit animation, then clean up and resolve the promise
    setDialog((prev) => (prev ? { ...prev, exiting: true } : null));
    setTimeout(() => {
      setDialog(null);
      resolverRef.current?.(result);
      resolverRef.current = null;
    }, 260);
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {dialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <ConfirmPanel
            options={dialog.options}
            exiting={dialog.exiting}
            onResolve={resolve}
          />
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, description?: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });
export function useToast() { return useContext(ToastContext); }

// ─── Per-type visual config ───────────────────────────────────────────────────

const typeConfig = {
  success: {
    Icon:      CheckCircle2,
    border:    "border-l-emerald-500",
    iconBg:    "bg-emerald-50",
    iconColor: "text-emerald-600",
    bar:       "bg-emerald-500",
    label:     "Success",
  },
  error: {
    Icon:      XCircle,
    border:    "border-l-red-500",
    iconBg:    "bg-red-50",
    iconColor: "text-red-500",
    bar:       "bg-red-500",
    label:     "Error",
  },
  warning: {
    Icon:      AlertTriangle,
    border:    "border-l-amber-500",
    iconBg:    "bg-amber-50",
    iconColor: "text-amber-500",
    bar:       "bg-amber-500",
    label:     "Warning",
  },
  info: {
    Icon:      Info,
    border:    "border-l-blue-500",
    iconBg:    "bg-blue-50",
    iconColor: "text-blue-500",
    bar:       "bg-blue-500",
    label:     "Info",
  },
} as const;

// ─── Individual Toast Card ────────────────────────────────────────────────────

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [exiting, setExiting]     = useState(false);
  const [paused, setPaused]       = useState(false);
  const timerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef              = useRef(item.duration);
  const startRef                  = useRef(Date.now());

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(item.id), 340);
  }, [item.id, onDismiss]);

  // Start the auto-dismiss timer on mount
  useEffect(() => {
    startRef.current = Date.now();
    timerRef.current = setTimeout(dismiss, remainingRef.current);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [dismiss]);

  const handleMouseEnter = () => {
    setPaused(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    remainingRef.current = Math.max(
      0,
      remainingRef.current - (Date.now() - startRef.current),
    );
  };

  const handleMouseLeave = () => {
    setPaused(false);
    startRef.current = Date.now();
    timerRef.current = setTimeout(dismiss, remainingRef.current);
  };

  const cfg = typeConfig[item.type];
  const { Icon } = cfg;

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        // Shape & shadow
        "w-[360px] bg-white rounded-2xl overflow-hidden",
        "border border-gray-100/80 border-l-[4px]",
        "shadow-[0_8px_32px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)]",
        cfg.border,
        // Animation
        exiting
          ? "animate-[toast-exit_340ms_ease-in_forwards]"
          : "animate-[toast-enter_400ms_cubic-bezier(0.34,1.56,0.64,1)_forwards]",
      )}
    >
      {/* Content row */}
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Icon badge */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5",
            cfg.iconBg,
          )}
        >
          <Icon size={15} className={cfg.iconColor} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-[13.5px] font-semibold text-gray-900 leading-snug">
            {item.title}
          </p>
          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={dismiss}
          aria-label="Dismiss notification"
          className={cn(
            "flex-shrink-0 w-6 h-6 flex items-center justify-center",
            "rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100",
            "transition-colors mt-0.5 cursor-pointer",
          )}
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      </div>

      {/* Progress bar — drains from left to right */}
      <div className="h-[3px] bg-gray-100">
        <div
          className={cn("h-full w-full origin-left", cfg.bar)}
          style={{
            animation: `progress-drain ${item.duration}ms linear forwards`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type, title, description, duration: 4500 }]);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Stack — top-right, pointer-events only on the cards */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard item={t} onDismiss={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

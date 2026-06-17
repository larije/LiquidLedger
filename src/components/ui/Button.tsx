import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-gradient-to-r from-blue-600 to-blue-700 text-white " +
    "shadow-[0_2px_8px_rgba(37,99,235,0.30)] " +
    "hover:from-blue-700 hover:to-blue-800 " +
    "hover:shadow-[0_4px_14px_rgba(37,99,235,0.40)] " +
    "disabled:opacity-50 disabled:shadow-none",
  secondary:
    "bg-white text-gray-700 border border-gray-200 shadow-sm " +
    "hover:bg-gray-50 hover:border-gray-300 " +
    "disabled:opacity-50",
  danger:
    "bg-gradient-to-r from-red-500 to-red-600 text-white " +
    "shadow-[0_2px_8px_rgba(239,68,68,0.28)] " +
    "hover:from-red-600 hover:to-red-700 " +
    "disabled:opacity-50 disabled:shadow-none",
  success:
    "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white " +
    "shadow-[0_2px_8px_rgba(16,185,129,0.28)] " +
    "hover:from-emerald-600 hover:to-emerald-700 " +
    "disabled:opacity-50 disabled:shadow-none",
  ghost:
    "text-gray-600 hover:bg-gray-100 hover:text-gray-900 " +
    "disabled:opacity-50",
  outline:
    "border border-gray-300 text-gray-700 " +
    "hover:bg-gray-50 hover:border-gray-400 " +
    "disabled:opacity-50",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs gap-1",
  md: "px-4 py-2 text-sm gap-1.5",
  lg: "px-5 py-2.5 text-sm gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  loading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium",
        "transition-all duration-200 cursor-pointer",
        "hover:scale-[1.02] active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:scale-100",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && <Loader2 size={14} className="animate-spin shrink-0" />}
      {children}
    </button>
  );
}

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: "bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
  ghost: "text-gray-700 hover:bg-gray-100 disabled:opacity-50",
  outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50",
};
const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2.5 text-base",
};

export default function Button({
  variant = "primary", size = "md", className, children, ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}

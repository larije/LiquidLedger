import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const chip: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-600 border-gray-200/80",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger:  "bg-red-50 text-red-700 border-red-200",
  info:    "bg-blue-50 text-blue-700 border-blue-200",
};

const dotColor: Record<BadgeVariant, string> = {
  default: "bg-gray-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
  info:    "bg-blue-500",
};

export default function Badge({
  children,
  variant = "default",
  className,
  dot,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        chip[variant],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor[variant])} />
      )}
      {children}
    </span>
  );
}

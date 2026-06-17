import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  hover?: boolean;
}

export function Card({ className, style, children, hover }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-200/80",
        "shadow-[0_1px_3px_rgba(0,0,0,0.05),_0_4px_12px_rgba(0,0,0,0.04)]",
        hover && "card-lift cursor-pointer",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("px-7 py-5 border-b border-gray-100", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h3 className={cn("font-semibold text-gray-900 text-[15px] tracking-[-0.01em]", className)}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("px-7 py-6", className)}>
      {children}
    </div>
  );
}

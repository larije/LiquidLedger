import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";
import LayoutShell from "@/components/layout/LayoutShell";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LiquidLedger — PTO Fuel Liquidation",
  description: "Provincial Treasurer's Office Fuel Cash Advance Liquidation System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${inter.className}`}>
      <body className="h-full bg-[#F8FAFC]">
        <ToastProvider>
          <ConfirmDialogProvider>
            <LayoutShell>{children}</LayoutShell>
          </ConfirmDialogProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

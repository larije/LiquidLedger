import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "LiquidLedger — PTO Fuel Liquidation",
  description: "Provincial Treasurer's Office Fuel Cash Advance Liquidation System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50">
        <ToastProvider>
          <Sidebar />
          <main className="ml-[260px] min-h-screen p-6">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}

"use client";

import { SidebarProvider, useSidebar } from "./SidebarContext";
import Sidebar from "./Sidebar";
import AppHeader from "./AppHeader";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <>
      <Sidebar />
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out print:ml-0 ${
          collapsed ? "ml-[68px]" : "ml-[260px]"
        }`}
      >
        <AppHeader />
        <main className="flex-1 p-10 print:p-0 print:m-0">
          {children}
        </main>
      </div>
    </>
  );
}

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}

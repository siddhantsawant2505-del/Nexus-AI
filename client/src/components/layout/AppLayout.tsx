import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Technical Grid Overlay */}
      <div className="absolute inset-0 data-grid-overlay pointer-events-none opacity-40" />
      
      <DesktopSidebar />
      <main className="relative z-10 md:ml-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

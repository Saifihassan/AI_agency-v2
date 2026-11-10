"use client";

import { WorkspaceProvider } from "@/components/workspace";
import Sidebar from "@/components/sidebar";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <WorkspaceProvider>
      <div className="shell">
        <Sidebar />
        <main className="main">{children}</main>
      </div>
    </WorkspaceProvider>
  );
}

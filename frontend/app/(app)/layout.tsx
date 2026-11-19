"use client";

import { WorkspaceProvider } from "@/components/workspace";
import Sidebar from "@/components/sidebar";
import { UsageLimitModal } from "@/components/usagelimit";
import { UsageProvider } from "@/components/usage";
import { ProviderProvider } from "@/components/provider";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <WorkspaceProvider>
      <ProviderProvider>
        <UsageProvider>
          <div className="shell">
            <Sidebar />
            <main className="main">{children}</main>
          </div>
          <UsageLimitModal />
        </UsageProvider>
      </ProviderProvider>
    </WorkspaceProvider>
  );
}

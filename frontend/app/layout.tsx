import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import { WorkspaceProvider } from "@/components/workspace";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "AI Agency OS v2",
  description: "Full-stack marketing agency operating system — agents for content, research, outreach and competitor analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body>
        <WorkspaceProvider>
          <div className="shell">
            <Sidebar />
            <main className="main">{children}</main>
          </div>
        </WorkspaceProvider>
      </body>
    </html>
  );
}

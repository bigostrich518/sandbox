import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MockModeProvider } from "@/components/MockModeContext";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LLM SEO Dashboard",
  description: "Track and optimize your website for AI models.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 h-screen flex overflow-hidden antialiased`}>
        <MockModeProvider>
          <Sidebar />
          <main className="flex-1 h-full overflow-y-auto bg-slate-950">
            {children}
          </main>
        </MockModeProvider>
      </body>
    </html>
  );
}

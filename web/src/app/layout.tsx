import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Stardew Valley VN - Tra Cứu",
  description: "Từ điển tra cứu Stardew Valley Tiếng Việt nhanh chóng, mượt mà.",
};

export const revalidate = 3600; // Cache for layout

async function getCategories() {
  const { data, error } = await supabase
    .from('pages')
    .select('category')
    .not('category', 'is', null);

  if (error) return [];

  const counts = data.reduce((acc: any, row) => {
    acc[row.category] = (acc[row.category] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getCategories();

  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col text-slate-100">
        <header className="sticky top-0 z-40 glass-panel border-b border-white/10 px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-4">
            <Sidebar categories={categories} />
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              🌾 Stardew Wiki VN
            </Link>
          </div>
          <nav className="flex gap-4">
            <Link href="/search" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full">
              <Search size={16} />
              <span className="hidden sm:inline text-sm font-medium">Tìm kiếm nâng cao</span>
            </Link>
          </nav>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-0">
          {children}
        </main>
        <footer className="text-center p-6 text-slate-500 text-sm border-t border-white/5 mt-auto">
          Dữ liệu được crawl từ Stardew Valley Vietnam Fandom. App không vì mục đích thương mại.
        </footer>
      </body>
    </html>
  );
}

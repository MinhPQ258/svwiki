"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Search, ChevronRight } from "lucide-react";

export default function Sidebar({ categories }: { categories: { name: string; count: number }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Hamburger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 -ml-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-[320px] glass-panel border-r border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
          <Link 
            href="/" 
            className="text-lg font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent"
            onClick={() => setIsOpen(false)}
          >
            🌾 Wiki Danh Mục
          </Link>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh..."
              className="w-full glass-input rounded-xl py-2 pl-10 pr-4 text-sm focus:shadow-primary/20"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Danh mục chính
          </h3>
          <ul className="space-y-1">
            {categories.map((cat) => (
              <li key={cat.name}>
                <Link
                  href={`/search?category=${encodeURIComponent(cat.name)}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-2 rounded-lg text-slate-300 hover:text-white hover:bg-primary/20 group transition-all"
                >
                  <span className="capitalize text-sm font-medium">{cat.name.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full group-hover:bg-primary/30 group-hover:text-primary-200">
                      {cat.count}
                    </span>
                    <ChevronRight size={14} className="text-slate-500 group-hover:text-primary-300 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </li>
            ))}
            {categories.length === 0 && (
              <li className="text-sm text-slate-500 px-2">Chưa có danh mục nào.</li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}

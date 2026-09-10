"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Search, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialQuery = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("category") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [serverResults, setServerResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!activeQuery.trim() && !categoryFilter) {
        setServerResults([]);
        return;
      }
      
      setIsLoading(true);
      setShowErrorPopup(false);
      
      let req = supabase
        .from("pages")
        .select("title, slug, summary, category, image_url");
      
      if (activeQuery.trim()) {
        req = req.ilike("title", `%${activeQuery}%`);
      }
      if (categoryFilter) {
        req = req.eq("category", categoryFilter);
      }
      
      const { data, error } = await req.limit(50);
      
      if (error) {
        console.error("Lỗi tìm kiếm:", error);
      } else {
        setServerResults(data || []);
        if (data?.length === 0) {
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
        }
      }
      setIsLoading(false);
    };

    fetchResults();
  }, [activeQuery, categoryFilter]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveQuery(query);
    
    const newParams = new URLSearchParams(searchParams.toString());
    if (query) newParams.set("q", query);
    else newParams.delete("q");
    router.replace(`/search?${newParams.toString()}`, { scroll: false });
  };

  const filteredResults = serverResults.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) || 
    (item.summary && item.summary.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="w-full animate-fade-in relative pb-20">
      {showErrorPopup && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">Không tìm thấy dữ liệu nào phù hợp!</span>
          </div>
        </div>
      )}

      <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors p-2 -ml-2">
        <ArrowLeft className="w-5 h-5 shrink-0" /> Quay lại trang chủ
      </Link>
      
      <form onSubmit={handleSearchSubmit} className="relative mb-8 group">
        <button 
          type="submit" 
          className="absolute inset-y-0 left-4 flex items-center text-slate-400 hover:text-primary transition-colors cursor-pointer"
        >
          <Search className="w-6 h-6 shrink-0" />
        </button>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập và nhấn Enter để tìm..."
          className="w-full glass-input rounded-2xl py-4 md:py-5 pl-14 pr-6 text-lg md:text-xl shadow-lg focus:shadow-primary/20"
          autoFocus
        />
      </form>

      {categoryFilter && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-slate-300">
          <span>Đang lọc:</span>
          <span className="bg-primary/20 text-primary-300 px-3 py-1 rounded-full text-sm font-semibold capitalize">
            {categoryFilter.replace(/_/g, ' ')}
          </span>
          <button 
            onClick={() => {
              const newParams = new URLSearchParams(searchParams.toString());
              newParams.delete("category");
              router.replace(`/search?${newParams.toString()}`);
            }}
            className="text-sm underline text-slate-400 hover:text-white p-1"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary w-10 h-10 shrink-0" />
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResults.map((item) => (
            <Link 
              href={`/page/${item.slug}`} 
              key={item.slug}
              className="glass-panel p-4 rounded-xl hover:-translate-y-1 hover:border-primary/50 transition-all flex gap-4 items-start group"
            >
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.title} 
                  className="w-16 h-16 shrink-0 object-contain rounded bg-slate-800/50"
                />
              ) : (
                <div className="w-16 h-16 shrink-0 rounded bg-slate-800/50 flex items-center justify-center text-2xl">
                  🌾
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base md:text-lg text-slate-100 group-hover:text-primary-300 transition-colors truncate">
                  {item.title}
                </h3>
                {item.category && (
                  <span className="text-xs text-primary/80 uppercase tracking-wider font-semibold inline-block mb-1">
                    {item.category}
                  </span>
                )}
                <p className="text-sm text-slate-400 line-clamp-2">
                  {item.summary}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (activeQuery || categoryFilter) ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg md:text-xl">Không tìm thấy kết quả nào trong danh sách. 😿</p>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">
          <p>Nhập từ khóa và nhấn Enter để bắt đầu tìm kiếm!</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary w-10 h-10 shrink-0" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

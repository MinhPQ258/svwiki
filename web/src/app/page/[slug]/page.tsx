import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600; // Cache for 1 hour

async function getPageData(slug: string) {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }
  return data;
}

// Generate Static Params for build time if we want, but dynamic is fine for now.
export default async function DetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pageData = await getPageData(slug);

  if (!pageData) {
    notFound();
  }

  // Chuyển infobox từ JSON object sang mảng để dễ hiển thị
  const infoboxEntries = pageData.infobox_json ? Object.entries(pageData.infobox_json) : [];

  return (
    <div className="w-full animate-fade-in pb-20">
      <Link href="/search" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /> Tìm kiếm khác
      </Link>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 glass-panel rounded-2xl p-6 md:p-8 order-2 lg:order-1">
          <header className="mb-8 border-b border-white/10 pb-6">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl md:text-5xl font-extrabold text-white">
                {pageData.title}
              </h1>
              {pageData.category && (
                <span className="bg-primary/20 text-primary-300 px-3 py-1 rounded-full text-sm font-semibold capitalize hidden md:inline-block">
                  {pageData.category.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            {pageData.summary && (
              <p className="text-lg text-slate-300 italic">
                {pageData.summary}
              </p>
            )}
          </header>

          <div 
            className="wiki-content"
            dangerouslySetInnerHTML={{ __html: pageData.content_html }}
          />
        </div>

        {/* Infobox Sidebar */}
        <div className="w-full lg:w-80 shrink-0 glass-panel rounded-2xl overflow-hidden order-1 lg:order-2 sticky top-24">
          {pageData.image_url && (
            <div className="bg-slate-900/50 p-6 flex justify-center">
              <img 
                src={pageData.image_url} 
                alt={pageData.title}
                className="max-w-full h-auto max-h-48 object-contain drop-shadow-xl" 
              />
            </div>
          )}
          
          <div className="p-0">
            <h3 className="bg-primary/20 text-center py-3 font-bold text-lg text-primary-100 border-y border-white/5">
              Thông tin cơ bản
            </h3>
            {infoboxEntries.length > 0 ? (
              <ul className="divide-y divide-white/5">
                {infoboxEntries.map(([key, value]) => (
                  <li key={key} className="flex flex-col sm:flex-row sm:justify-between p-4 hover:bg-white/5 transition-colors">
                    <span className="text-slate-400 text-sm font-medium mb-1 sm:mb-0 sm:w-1/3">{key}</span>
                    <span className="text-slate-100 text-sm sm:w-2/3 sm:text-right font-semibold">{String(value)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-6 text-center text-slate-400 text-sm">
                Không có thông tin tóm tắt cho trang này.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

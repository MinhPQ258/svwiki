import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Search } from "lucide-react";

export const revalidate = 3600; // Revalidate every hour

async function getCategories() {
  const { data, error } = await supabase
    .from('pages')
    .select('category')
    .not('category', 'is', null);

  if (error) {
    console.error("Lỗi lấy danh mục:", error);
    return [];
  }

  // Lấy các danh mục độc nhất (unique) và đếm số lượng trang
  const counts = data.reduce((acc: any, row) => {
    acc[row.category] = (acc[row.category] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12); // Lấy 12 danh mục phổ biến nhất
}

export default async function Home() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col w-full min-h-[80vh] py-6 md:py-10 pb-28 md:pb-10">
      <div className="order-1 text-center max-w-2xl mx-auto mb-8 md:mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 via-emerald-400 to-amber-300 bg-clip-text text-transparent drop-shadow-sm">
          Stardew Valley VN
        </h1>
        <p className="text-base md:text-lg text-slate-300">
          Tra cứu nhanh vật phẩm, nhân vật, công thức và mọi thứ bạn cần cho nông trại của mình.
        </p>
      </div>

      {/* Thanh Tìm Kiếm (Fixed bottom on Mobile, Static order-2 on Desktop) */}
      <div className="order-3 md:order-2 fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-md border-t border-white/10 z-40 md:static md:bg-transparent md:border-none md:p-0 md:w-full md:max-w-xl md:mx-auto md:mb-16">
        <div className="relative max-w-xl mx-auto">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="text-slate-400" size={20} />
          </div>
          <Link href="/search" className="block w-full">
            <input
              type="text"
              readOnly
              placeholder="Tìm kiếm vật phẩm, nhân vật..."
              className="w-full glass-input rounded-full py-4 pl-12 pr-6 text-lg cursor-pointer hover:bg-slate-800/80 pointer-events-none shadow-xl"
            />
          </Link>
        </div>
      </div>

      {/* Danh mục phổ biến (order-2 on Mobile, order-3 on Desktop) */}
      <div className="order-2 md:order-3 w-full animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-center text-slate-200">Khám Phá Nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/search?category=${encodeURIComponent(cat.name)}`}
              className="glass-panel p-4 md:p-5 rounded-xl hover:-translate-y-1 transition-transform group flex flex-col items-center justify-center text-center gap-2"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/20 group-hover:bg-primary/40 flex items-center justify-center text-2xl transition-colors">
                ✨
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 capitalize text-sm md:text-base">{cat.name.replace(/_/g, ' ')}</h3>
                <span className="text-xs text-slate-400">{cat.count} bài viết</span>
              </div>
            </Link>
          ))}
          {categories.length === 0 && (
            <p className="col-span-full text-center text-slate-400">
              Chưa có dữ liệu danh mục. Hãy chờ Crawler chạy xong nhé!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

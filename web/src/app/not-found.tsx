import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in px-4">
      <div className="text-[120px] mb-4">🍂</div>
      <h2 className="text-4xl font-bold text-white mb-4">404 - Không tìm thấy trang</h2>
      <p className="text-slate-400 text-lg mb-8 max-w-md">
        Có vẻ như bạn đã đi lạc vào Khu Rừng Bí Mật và không tìm thấy trang bạn cần.
      </p>
      <Link 
        href="/" 
        className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 text-white transition-all"
      >
        <ArrowLeft className="w-5 h-5 shrink-0" />
        Về Nông Trại (Trang chủ)
      </Link>
    </div>
  );
}

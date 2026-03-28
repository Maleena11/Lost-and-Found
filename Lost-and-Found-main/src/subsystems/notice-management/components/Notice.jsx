import { Link } from "react-router-dom";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import NoticeSection from "./NoticeSection";

export default function Notice() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      <Header />

      {/* Page Banner */}
      <div className="relative overflow-hidden text-white" style={{ background: "linear-gradient(135deg, #0f1f4d 0%, #162660 40%, #1a1050 100%)" }}>
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #34d399, #60a5fa, #a78bfa, #f472b6, #34d399)", backgroundSize: "200% 100%", animation: "shimmer 4s linear infinite" }} />
        <style>{`@keyframes shimmer { 0%{background-position:0% 0%} 100%{background-position:200% 0%} }`}</style>
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ background: "linear-gradient(120deg, transparent 30%, white 50%, transparent 70%)" }} />

        <div className="max-w-7xl mx-auto px-6 py-10 relative">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-blue-300 text-xs mb-4">
                <i className="fas fa-home text-[10px]"></i>
                <span>Home</span>
                <i className="fas fa-chevron-right text-[10px]"></i>
                <span className="text-white font-semibold">Notice Board</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-[11px] font-semibold text-blue-200 mb-3 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                Campus Announcements
              </div>
              <h1 className="text-4xl font-extrabold mb-2 tracking-tight leading-tight">
                Notice <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #5eead4, #67e8f9)" }}>Board</span>
              </h1>
              <p className="text-blue-200 text-sm max-w-xl leading-relaxed mt-1">
                View official campus announcements and notices.
              </p>
              <div className="flex flex-wrap gap-2.5 mt-5">
                {[
                  { icon: "fa-list",             text: "All Notices",   color: "text-blue-300"   },
                  { icon: "fa-search-minus",     text: "Lost Items",    color: "text-red-300"    },
                  { icon: "fa-hand-holding",     text: "Found Items",   color: "text-emerald-300"},
                  { icon: "fa-exclamation-circle", text: "Urgent Alerts", color: "text-amber-300" },
                ].map(({ icon, text, color }) => (
                  <div key={text} className="flex items-center gap-2 bg-white/10 hover:bg-white/[0.15] transition-colors border border-white/10 rounded-lg px-3 py-1.5 text-xs backdrop-blur-sm">
                    <i className={`fas ${icon} ${color} text-[11px]`}></i>
                    <span className="text-white/90">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex flex-col items-center gap-4 flex-shrink-0">
              <div className="relative">
                <div className="w-36 h-36 rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl shadow-black/40 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <i className="fas fa-bullhorn text-white/80 text-5xl"></i>
                </div>
                <div className="absolute -top-2 -right-2 w-9 h-9 bg-teal-400 rounded-full flex items-center justify-center shadow-lg border-2 border-teal-300">
                  <i className="fas fa-bell text-white text-sm"></i>
                </div>
                <div className="absolute -bottom-2 -left-2 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-md border-2 border-amber-300">
                  <i className="fas fa-exclamation text-white text-[10px]"></i>
                </div>
              </div>
              <div className="text-center">
                <Link
                  to="/item-board"
                  className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl font-semibold text-xs transition-colors shadow-lg mt-1"
                >
                  <i className="fas fa-clipboard-list text-[11px]"></i>
                  View Lost &amp; Found Board
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full">
        <NoticeSection />
      </main>

      <Footer />
    </div>
  );
}

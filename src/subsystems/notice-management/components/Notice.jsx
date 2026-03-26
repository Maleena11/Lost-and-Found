import { Link } from "react-router-dom";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import NoticeSection from "./NoticeSection";

export default function Notice() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      <Header />

      {/* Page Banner */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-950 text-white py-12 px-6 relative overflow-hidden">
        {/* Dot grid background */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        {/* Right fade overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-indigo-900/60 to-transparent hidden lg:block" />

        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-blue-300 text-xs mb-3">
                <i className="fas fa-home text-xs"></i>
                <span>Home</span>
                <i className="fas fa-chevron-right text-xs"></i>
                <span className="text-white font-medium">Notice Board</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-bullhorn text-white text-lg"></i>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">Notice Board</h1>
              </div>
              <p className="text-blue-300 text-sm leading-relaxed max-w-xl">
                View official campus announcements and notices.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                to="/item-board"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-md"
              >
                <i className="fas fa-clipboard-list text-xs"></i>
                View Lost & Found Board
              </Link>
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

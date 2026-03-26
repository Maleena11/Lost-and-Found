import { Link } from "react-router-dom";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import NoticeSection from "./NoticeSection";

export default function Notice() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      <Header />

      {/* Page Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
              <i className="fas fa-home text-xs"></i>
              <span>Home</span>
              <i className="fas fa-chevron-right text-xs"></i>
              <span className="text-white font-medium">Notice Board</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">Notice Board</h1>
            <p className="text-blue-200 text-sm">View official campus announcements and notices.</p>
          </div>
          <div>
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

      <main className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full">
        <NoticeSection />
      </main>

      <Footer />
    </div>
  );
}

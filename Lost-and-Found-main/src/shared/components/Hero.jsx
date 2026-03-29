import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackgroundCarousel from "./BackgroundCarousel";
import "../../Hero.css";

export default function Hero() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/notice?q=${encodeURIComponent(trimmed)}`);
  };

  const backgroundImages = [
    '/slide_1.png',
    '/slide_2.png',
    '/slide_3.png'
  ];

  return (
    <section className="relative h-[500px]">
      <BackgroundCarousel
        images={backgroundImages}
        autoSlideInterval={6000}
        className="absolute inset-0"
      >
        <div className="absolute top-4 right-4">
          <div className="p-2">
            
            <div className="flex max-w-xl mx-auto">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Describe what you lost..."
                className="flex-1 p-3 rounded-l text-black"
              />
              <button
                onClick={handleSearch}
                className="bg-orange-500 px-6 rounded-r hover:bg-orange-600 transition-colors"
              >
                <i className="fas fa-search"></i> Search
              </button>
            </div>
          </div>
        </div>
      </BackgroundCarousel>
    </section>
  );
}

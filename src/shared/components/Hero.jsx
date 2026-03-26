import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../Hero.css";
import BackgroundCarousel from "./BackgroundCarousel";

export default function Hero() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/notice?q=${encodeURIComponent(trimmed)}`);
  };

  const backgroundImages = [
    '/pic4.jpg',
    '/pic5.webp',
    '/pic1.webp'
  ];

  return (
    <section className="relative h-[500px]">
      <BackgroundCarousel
        images={backgroundImages}
        autoSlideInterval={6000}
        className="absolute inset-0"
      >
        <div className="h-full flex items-center justify-center text-center text-white">
          <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-4xl font-bold mb-4">Lost Something on Campus?</h2>
            <p className="mb-6 text-lg">
              We help reunite lost items with their owners across our university campus
            </p>
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

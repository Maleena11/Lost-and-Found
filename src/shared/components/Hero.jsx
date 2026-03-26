import "../../Hero.css";

export default function Hero() {
  return (
    <section className="relative h-[500px] bg-gray-800">
      <div className="h-full flex items-center justify-center text-center text-white">
        <div className="max-w-2xl mx-auto p-4">
          <h2 className="text-4xl font-bold mb-4">Lost Something on Campus?</h2>
          <p className="mb-6 text-lg">
            We help reunite lost items with their owners across our university campus
          </p>
          <div className="flex max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Describe what you lost..."
              className="flex-1 p-3 rounded-l text-black"
            />
            <button className="bg-orange-500 px-6 rounded-r hover:bg-orange-600">
              <i className="fas fa-search"></i> Search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

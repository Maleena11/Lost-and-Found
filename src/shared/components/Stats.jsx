export default function Stats() {
  const stats = [
    { icon: "fa-search", number: "1,254", text: "Items Found This Month" },
    { icon: "fa-smile", number: "892", text: "Happy Reunions This Month" },
    { icon: "fa-university", number: "12", text: "Faculties Covered" },
    { icon: "fa-users", number: "56", text: "Dedicated Staff Members" },
  ];

  return (
    <section className="bg-white py-16 text-center">
      <div className="max-w-6xl mx-auto grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className="p-6 shadow-lg rounded-lg hover:-translate-y-1 transition"
          >
            <i className={`fas ${s.icon} text-4xl text-blue-900 mb-4`}></i>
            <h3 className="text-3xl font-bold text-blue-900">{s.number}</h3>
            <p className="text-gray-600">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

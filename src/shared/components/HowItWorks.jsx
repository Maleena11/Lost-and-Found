export default function HowItWorks() {
  const steps = [
    { 
      step: 1, 
      icon: "fas fa-edit",
      title: "Report Your Lost Item", 
      desc: "Fill out a detailed form with information about your lost item, including description, location, and time.",
      details: ["Item description", "Location details", "Date & time", "Contact information"]
    },
    { 
      step: 2, 
      icon: "fas fa-search",
      title: "We Search Our Database", 
      desc: "Our advanced matching system searches through all reported found items across the university campus.",
      details: ["Smart matching", "Campus-wide search", "Real-time updates", "Cross-reference data"]
    },
    { 
      step: 3, 
      icon: "fas fa-bell",
      title: "Get Instant Notification", 
      desc: "Receive immediate alerts via SMS, email, or app notification when a potential match is found.",
      details: ["SMS alerts", "Email notifications", "App notifications", "Match details"]
    },
    { 
      step: 4, 
      icon: "fas fa-shield-check",
      title: "Verify & Claim", 
      desc: "Complete our secure verification process to prove ownership and arrange safe item collection.",
      details: ["Identity verification", "Proof of ownership", "Secure collection", "Staff assistance"]
    }
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our simple 4-step process makes it easy to report lost items and get them back quickly and securely.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line - Hidden on mobile */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300 via-blue-600 to-blue-900"></div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, index) => (
              <div key={s.step} className="relative">
                {/* Step Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 relative z-10">
                  {/* Step Number Circle */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-900 text-white rounded-full mx-auto mb-4 font-bold text-xl shadow-lg">
                      {s.step}
                    </div>
                    {/* Icon */}
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-md">
                      <i className={`${s.icon} text-sm`}></i>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-bold text-xl text-gray-900 mb-4">{s.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{s.desc}</p>

                  {/* Feature List */}
                  <ul className="text-sm text-gray-500 space-y-2">
                    {s.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center justify-center">
                        <i className="fas fa-check text-green-500 text-xs mr-2"></i>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Arrow connector - Hidden on last item and mobile */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-4 z-20">
                    <div className="w-8 h-8 bg-white border-2 border-blue-700 rounded-full flex items-center justify-center">
                      <i className="fas fa-arrow-right text-blue-800 text-sm"></i>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Your Recovery Journey Today</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Don't let lost items stay lost. Our proven process has helped thousands of students recover their belongings.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

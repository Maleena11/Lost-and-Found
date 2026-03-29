import React from 'react';
import { useNavigate } from 'react-router-dom';

const OurServices = () => {
  const navigate = useNavigate();
  const services = [
    {
      id: 1,
      icon: "fas fa-search",
      title: "Lost Item Search",
      description: "Comprehensive search system to find your lost belongings across the entire university campus.",
      features: ["Advanced search filters", "Real-time database", "Multi-language support"]
    },
    {
      id: 2,
      icon: "fas fa-bell",
      title: "Instant Notifications",
      description: "Get notified immediately when your lost item is found or when similar items are reported.",
      features: ["SMS alerts", "Email notifications", "Push notifications"]
    },
    {
      id: 3,
      icon: "fas fa-shield-alt",
      title: "Secure Verification",
      description: "Advanced verification system to ensure items are returned to their rightful owners safely.",
      features: ["Identity verification", "Proof of ownership", "Secure handover process"]
    },
    {
      id: 4,
      icon: "fas fa-map-marked-alt",
      title: "Location Tracking",
      description: "Track where your item was found with precise location details and campus building information.",
      features: ["GPS coordinates", "Campus mapping", "Time tracking"]
    },
    {
      id: 5,
      icon: "fas fa-users",
      title: "Community Support",
      description: "Join a community of helpful students and staff working together to reunite lost items.",
      features: ["Student reports", "Staff assistance", "Community feedback"]
    },
    {
      id: 6,
      icon: "fas fa-clock",
      title: "24/7 Availability",
      description: "Report and search for lost items anytime, anywhere with our round-the-clock service.",
      features: ["Always accessible", "Quick response", "Emergency support"]
    }
  ];

return (
    <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    We provide comprehensive lost and found services to help reunite students with their belongings
                    across our university campus.
                </p>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map(service => (
                    <div 
                        key={service.id} 
                        className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                    >
                        {/* Icon */}
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                            <i className={`${service.icon} text-2xl text-blue-800`}></i>
                        </div>

                        {/* Title and Description */}
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">{service.title}</h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>

                        {/* Features List */}
                        <ul className="space-y-2">
                            {service.features.map((feature, index) => (
                                <li key={index} className="flex items-center text-sm text-gray-700">
                                    <i className="fas fa-check text-green-500 text-xs mr-3"></i>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16">
                <div className="bg-gradient-to-r from-blue-900 to-blue-950 rounded-2xl p-8 text-white">
                    <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                    <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                        Join thousands of students who have successfully recovered their lost items through our platform.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/item-board')}
                            className="bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                        >
                            Search All Items
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>
);
};

export default OurServices;
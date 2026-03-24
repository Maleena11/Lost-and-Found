import React from 'react';
import { useNavigate } from 'react-router-dom';

const AboutUs = () => {
  const navigate = useNavigate();
  const stats = [
    { number: "50,000+", label: "Items Recovered", icon: "fas fa-undo" },
    { number: "95%", label: "Success Rate", icon: "fas fa-chart-line" },
    { number: "24/7", label: "Service Available", icon: "fas fa-clock" },
    { number: "100+", label: "Campus Locations", icon: "fas fa-map-marker-alt" }
  ];

  const values = [
    {
      icon: "fas fa-heart",
      title: "Students First",
      description: "We believe in the power of student community and helping each other in times of need."
    },
    {
      icon: "fas fa-shield-alt",
      title: "Trust & Security",
      description: "Your privacy and security are our top priorities in every interaction."
    },
    {
      icon: "fas fa-rocket",
      title: "Innovation",
      description: "We continuously improve our technology to serve you better."
    },
    {
      icon: "fas fa-handshake",
      title: "Reliability",
      description: "Count on us to be there when you need us most."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main About Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">About Us</h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              We are dedicated to reuniting students with their lost belongings across the university campus.
              Our platform connects lost items with their owners through advanced technology and community support.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Founded with the mission to solve one of university life's most common problems, we've built a
              comprehensive system that serves thousands of students daily, making lost items a thing of the past.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className={`${stat.icon} text-2xl text-white`}></i>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{stat.number}</div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <i className="fas fa-bullseye text-2xl text-blue-600"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed">
              To create a seamless, secure, and efficient platform that reunites lost items with their owners,
              making campus life a more reliable and stress-free experience for every student.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
              <i className="fas fa-eye text-2xl text-orange-600"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
            <p className="text-gray-600 leading-relaxed">
              To become the leading lost and found solution for universities campus-wide,
              setting the standard for item recovery services and student community-driven support systems.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Values</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <i className={`${value.icon} text-2xl text-white`}></i>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h4>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team/Contact Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Join Our Community</h3>
          <p className="text-blue-100 mb-8 max-w-3xl mx-auto text-lg">
            Become part of a growing community of students, university staff, and volunteers working together
            to make campus life better for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/contact')} className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
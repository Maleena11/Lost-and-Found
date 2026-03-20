export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
        
        {/* About */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">
            UniFind - Lost & Found
          </h3>
          <p className="text-sm mb-6">
            Helping reunite lost items with their owners across the university
            campus since 2010.
          </p>
          <div className="flex space-x-4 text-lg">
            <a href="#" className="hover:text-amber-400 transition">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="hover:text-amber-400 transition">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="hover:text-amber-400 transition">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="hover:text-amber-400 transition">
              <i className="fab fa-linkedin-in"></i>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-amber-400 transition">Home</a>
            </li>
            <li>
              <a href="#" className="hover:text-amber-400 transition">Report Items</a>
            </li>
            <li>
              <a href="#" className="hover:text-amber-400 transition">Notice</a>
            </li>
            <li>
              <a href="#" className="hover:text-amber-400 transition">Verification</a>
            </li>
            <li>
              <a href="#" className="hover:text-amber-400 transition">Contact</a>
            </li>
            <li>
              <a href="http://localhost:5173/admin/login" className="hover:text-amber-400 transition">Admin Login</a>
            </li>
            <li>
              <a href="http://localhost:5173/admin/dashboard" className="hover:text-amber-400 transition">Admin Dashboard</a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Contact Us</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2">
              <i className="fas fa-map-marker-alt"></i>
              <span>Student Services Building, University Campus</span>
            </li>
            <li className="flex items-center space-x-2">
              <i className="fas fa-phone"></i>
              <span>(555) 123-4567</span>
            </li>
            <li className="flex items-center space-x-2">
              <i className="fas fa-envelope"></i>
              <span>lostandfound@university.edu</span>
            </li>
            <li className="flex items-center space-x-2">
              <i className="fas fa-clock"></i>
              <span>Mon-Fri: 8AM - 6PM</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm text-gray-400">
        <p>
          &copy; {new Date().getFullYear()} University Lost & Found Management
          System. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

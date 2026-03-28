import { useState } from "react";

export default function AdminLogin() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Please enter both username and password");
      return;
    }

    // For now, simple simulation
    console.log("Login attempt:", { username, password, rememberMe });

    alert("Login successful! Redirecting to admin dashboard...");
    // Redirect to dashboard page
    window.location.href = "/admin/dashboard"; 
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-r from-blue-700 via-red-700 to-yellow-400 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-800 text-white p-6 text-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <i className="fas fa-train"></i> Public Transport Lost & Found
          </h1>
          <p className="text-sm opacity-90">Government Transport Authority</p>
        </div>

        {/* Form */}
        <div className="p-6">
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <div className="relative">
              <label className="block mb-1 font-medium text-gray-700">Username</label>
              <i className="fas fa-user absolute left-3 top-10 text-blue-800"></i>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="relative">
              <label className="block mb-1 font-medium text-gray-700">Password</label>
              <i className="fas fa-lock absolute left-3 top-10 text-blue-800"></i>
              <input
                type="password"
                className="w-full border border-gray-300 rounded px-3 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4"
                />
                Remember Me
              </label>
              <a href="#" className="text-blue-800 font-medium hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-800 text-white py-3 rounded hover:bg-blue-900 font-semibold"
            >
              Login
            </button>
          </form>

          <div className="text-center text-gray-600 mt-5 text-sm">
            Don't have an account?{" "}
            <a href="#" className="text-blue-800 font-medium hover:underline">
              Register Here
            </a>
          </div>
        </div>

        <div className="text-center text-gray-500 text-xs p-4 border-t border-gray-200">
          © 2025 Government Transport Authority. All rights reserved.
        </div>
      </div>
    </div>
  );
}

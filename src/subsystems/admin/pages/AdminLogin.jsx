import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:3001/login/login", { username, password });
      if (res.status === 200) {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4 relative overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-white opacity-5 rounded-full"></div>
      <div className="absolute bottom-[-100px] right-[-60px] w-96 h-96 bg-white opacity-5 rounded-full"></div>
      <div className="absolute top-1/2 left-[-120px] w-56 h-56 bg-indigo-400 opacity-10 rounded-full"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-2xl mb-4 shadow-lg">
            <i className="fas fa-graduation-cap text-white text-4xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">UniFind</h1>
          <p className="text-blue-200 text-sm mt-1">Lost &amp; Found Administration Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Card header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-5 text-center">
            <h2 className="text-lg font-semibold text-white">Staff Sign In</h2>
            <p className="text-blue-100 text-xs mt-1">University Lost &amp; Found Management System</p>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            {error && (
              <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {/* Username */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <i className="fas fa-user text-sm"></i>
                  </span>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 placeholder-gray-400"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <i className="fas fa-lock text-sm"></i>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-10 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 placeholder-gray-400"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  Remember me
                </label>
                <a href="#" className="text-blue-600 font-medium hover:text-blue-800 hover:underline transition-colors">
                  Forgot Password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Signing In...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i>
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Back to site */}
            <div className="text-center mt-6 pt-5 border-t border-gray-100">
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <i className="fas fa-arrow-left text-xs"></i>
                Back to UniFind Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-blue-300 text-xs mt-6">
          © {new Date().getFullYear()} UniFind — University Lost &amp; Found Management System
        </p>
      </div>
    </div>
  );
}

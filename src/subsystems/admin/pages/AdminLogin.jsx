import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../shared/utils/AuthContext";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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
        const adminData = { username, id: res.data.admin?.id, role: "Admin" };
        localStorage.setItem("unifind_admin", JSON.stringify(adminData));
        login(adminData); // lets admin pass ProtectedRoute on user-side pages too
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 p-4 relative overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-white opacity-3 rounded-full"></div>
      <div className="absolute bottom-[-100px] right-[-60px] w-96 h-96 bg-white opacity-3 rounded-full"></div>
      <div className="absolute top-1/2 left-[-120px] w-56 h-56 bg-slate-600 opacity-10 rounded-full"></div>

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
        <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
          {/* Card header */}
          <div className="bg-gradient-to-r from-gray-800 to-slate-800 px-8 py-5 text-center">
            <h2 className="text-lg font-semibold text-white">Staff Sign In</h2>
            <p className="text-gray-400 text-xs mt-1">University Lost &amp; Found Management System</p>
          </div>

          {/* Form */}
          <div className="bg-gray-900 px-8 py-7">
            {error && (
              <div className="mb-5 flex items-start gap-3 p-4 bg-red-950 border border-red-800 text-red-400 rounded-xl text-sm">
                <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {/* Username */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-300">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <i className="fas fa-user text-sm"></i>
                  </span>
                  <input
                    type="text"
                    className="w-full border border-gray-700 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-600"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <i className="fas fa-lock text-sm"></i>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full border border-gray-700 rounded-xl px-4 py-3 pl-10 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-600"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer select-none text-gray-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-slate-500 rounded"
                  />
                  Remember me
                </label>
                <a href="#" className="text-slate-400 font-medium hover:text-slate-200 hover:underline transition-colors">
                  Forgot Password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-gray-700 to-slate-700 text-white py-3 rounded-xl font-semibold text-sm hover:from-gray-600 hover:to-slate-600 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
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
            <div className="text-center mt-6 pt-5 border-t border-gray-700">
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <i className="fas fa-arrow-left text-xs"></i>
                Back to UniFind Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-600 text-xs mt-6">
          © {new Date().getFullYear()} UniFind — University Lost &amp; Found Management System
        </p>
      </div>
    </div>
  );
}

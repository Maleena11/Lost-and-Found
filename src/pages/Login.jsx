import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../shared/utils/AuthContext";

const initialForm = { email: "", password: "" };

const validate = (form) => {
  const errors = {};
  const val = form.email.trim();
  if (!val) {
    errors.email = "Email or username is required.";
  } else if (val.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.password) {
    errors.password = "Password is required.";
  } else if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  return errors;
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/";
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    if (touched[name]) {
      setErrors(validate(updated));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validate(form));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = { email: true, password: true };
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setServerError("");
    setSuccessMsg("");
    try {
      const res = await api.post("/users/login", {
        email: form.email,
        password: form.password,
      });
      if (res.status === 200) {
        const userData = res.data.user || { email: form.email };
        login(userData);
        if (userData.role === "Admin") {
          localStorage.setItem("unifind_admin", JSON.stringify({ username: userData.name, id: userData.id }));
        }
        setSuccessMsg("Login successful! Redirecting…");
        setTimeout(() => navigate(from, { replace: true }), 1200);
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (name) => {
    const base =
      "w-full border rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 placeholder-gray-400 transition-all";
    if (!touched[name]) return `${base} border-gray-200 focus:ring-blue-500`;
    if (errors[name]) return `${base} border-red-400 focus:ring-red-400 bg-red-50`;
    return `${base} border-green-400 focus:ring-green-400 bg-green-50`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-white opacity-5 rounded-full pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-60px] w-96 h-96 bg-white opacity-5 rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-[-120px] w-56 h-56 bg-indigo-400 opacity-10 rounded-full pointer-events-none" />
      <div className="absolute top-20 right-20 w-32 h-32 bg-blue-400 opacity-10 rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-2xl mb-4 shadow-lg">
            <i className="fas fa-search-location text-white text-4xl" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">UniFind</h1>
          <p className="text-blue-200 text-sm mt-1">University Lost &amp; Found Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Card header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-5 text-center">
            <h2 className="text-lg font-semibold text-white">Welcome Back</h2>
            <p className="text-blue-100 text-xs mt-1">Sign in to your account to continue</p>
          </div>

          {/* Form body */}
          <div className="px-8 py-7">
            {/* Server messages */}
            {serverError && (
              <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0" />
                <span>{serverError}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-5 flex items-start gap-3 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
                <i className="fas fa-check-circle mt-0.5 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {/* Email */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">
                  Email or Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <i className="fas fa-envelope text-sm" />
                  </span>
                  <input
                    type="text"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="you@university.edu or username"
                    autoComplete="email"
                    className={fieldClass("email")}
                  />
                  {touched.email && !errors.email && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500">
                      <i className="fas fa-check-circle text-sm" />
                    </span>
                  )}
                </div>
                {touched.email && errors.email && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <i className="fas fa-lock text-sm" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`${fieldClass("password")} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`} />
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle" />
                    {errors.password}
                  </p>
                )}
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
                <a
                  href="#"
                  className="text-blue-600 font-medium hover:text-blue-800 hover:underline transition-colors"
                >
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
                    <i className="fas fa-spinner fa-spin" />
                    Signing In…
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400">Don't have an account?</span>
              </div>
            </div>

            {/* Register link */}
            <Link
              to="/register"
              className="w-full flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all"
            >
              <i className="fas fa-user-plus" />
              Create Account
            </Link>

            {/* Back to home */}
            <div className="text-center mt-6 pt-5 border-t border-gray-100">
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <i className="fas fa-arrow-left text-xs" />
                Back to UniFind Portal
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          © {new Date().getFullYear()} UniFind — University Lost &amp; Found Management System
        </p>
      </div>
    </div>
  );
}

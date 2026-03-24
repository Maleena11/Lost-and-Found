import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  password: "",
  confirmPassword: "",
  agreeTerms: false,
};

<<<<<<< HEAD
const sliitEmailRegex = /^it\d{8}@my\.sliit\.lk$/;
const phoneRegex = /^0\d{9}$/;
=======
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;
>>>>>>> 49f17c69e1b9889dfe1f234e32bd3d56fa730e65

const validate = (form) => {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "Full name is required.";
  } else if (form.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  } else if (form.name.trim().length > 50) {
    errors.name = "Name must be less than 50 characters.";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!sliitEmailRegex.test(form.email.trim())) {
    errors.email = "Enter a valid SLIIT email (e.g. it23624859@my.sliit.lk).";
  }

  if (!form.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!phoneRegex.test(form.phone.trim())) {
<<<<<<< HEAD
    errors.phone = "Phone number must be 10 digits starting with 0 (e.g. 0712365852).";
=======
    errors.phone = "Please enter a valid 10-digit phone number.";
>>>>>>> 49f17c69e1b9889dfe1f234e32bd3d56fa730e65
  }

  if (!form.street.trim()) {
    errors.street = "Street address is required.";
  } else if (form.street.trim().length < 5) {
    errors.street = "Please enter a complete street address.";
  }

  if (!form.city.trim()) {
    errors.city = "City is required.";
  } else if (form.city.trim().length < 2) {
    errors.city = "City must be at least 2 characters.";
  }

  if (!form.password) {
    errors.password = "Password is required.";
  } else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (!/[A-Z]/.test(form.password)) {
    errors.password = "Password must contain at least one uppercase letter.";
  } else if (!/[0-9]/.test(form.password)) {
    errors.password = "Password must contain at least one number.";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!form.agreeTerms) {
    errors.agreeTerms = "You must agree to the Terms & Conditions.";
  }

  return errors;
};

const getPasswordStrength = (password) => {
  if (!password) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "20%" };
  if (score === 2) return { label: "Fair", color: "bg-orange-500", width: "40%" };
  if (score === 3) return { label: "Good", color: "bg-yellow-500", width: "60%" };
  if (score === 4) return { label: "Strong", color: "bg-blue-500", width: "80%" };
  return { label: "Very Strong", color: "bg-green-500", width: "100%" };
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const strength = getPasswordStrength(form.password);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updated = { ...form, [name]: type === "checkbox" ? checked : value };
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
    const allTouched = Object.fromEntries(Object.keys(initialForm).map((k) => [k, true]));
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setServerError("");
    setSuccessMsg("");
    try {
      const res = await api.post("/users", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        street: form.street.trim(),
        city: form.city.trim(),
        password: form.password,
      });
      if (res.status === 201 || res.status === 200) {
        setSuccessMsg("Account created successfully! Redirecting to login…");
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Registration failed. Please try again."
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

  const FieldError = ({ name }) =>
    touched[name] && errors[name] ? (
      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
        <i className="fas fa-exclamation-circle" />
        {errors[name]}
      </p>
    ) : null;

  const CheckIcon = ({ name }) =>
    touched[name] && !errors[name] ? (
      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500">
        <i className="fas fa-check-circle text-sm" />
      </span>
    ) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4 py-10 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-white opacity-5 rounded-full pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-60px] w-96 h-96 bg-white opacity-5 rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-[-80px] w-56 h-56 bg-indigo-400 opacity-10 rounded-full pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-32 h-32 bg-blue-400 opacity-10 rounded-full pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
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
            <h2 className="text-lg font-semibold text-white">Create Your Account</h2>
            <p className="text-blue-100 text-xs mt-1">Join UniFind to report and recover lost items</p>
          </div>

          {/* Progress steps indicator */}
          <div className="flex justify-center gap-2 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
              Personal Info
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <div className="w-6 h-px bg-gray-300" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
              Contact
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <div className="w-6 h-px bg-gray-300" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
              Security
            </div>
          </div>

          {/* Form body */}
          <div className="px-8 py-7">
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
              {/* Section: Personal Info */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="fas fa-user text-blue-400" />
                  Personal Information
                </p>
                <div className="flex flex-col gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <i className="fas fa-user text-sm" />
                      </span>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Nimali Perera"
                        autoComplete="name"
                        className={fieldClass("name")}
                      />
                      <CheckIcon name="name" />
                    </div>
                    <FieldError name="name" />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <i className="fas fa-envelope text-sm" />
                      </span>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="it23624859@my.sliit.lk"
                        autoComplete="email"
                        className={fieldClass("email")}
                      />
                      <CheckIcon name="email" />
                    </div>
                    <FieldError name="email" />
                  </div>
                </div>
              </div>

              {/* Section: Contact */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="fas fa-map-marker-alt text-blue-400" />
                  Contact &amp; Address
                </p>
                <div className="flex flex-col gap-4">
                  {/* Phone */}
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <i className="fas fa-phone text-sm" />
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="0712365852"
                        autoComplete="tel"
                        className={fieldClass("phone")}
                      />
                      <CheckIcon name="phone" />
                    </div>
                    <FieldError name="phone" />
                  </div>

                  {/* Street + City row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-700">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          <i className="fas fa-road text-sm" />
                        </span>
                        <input
                          type="text"
                          name="street"
                          value={form.street}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="123 Main St"
                          autoComplete="street-address"
                          className={fieldClass("street")}
                        />
                        <CheckIcon name="street" />
                      </div>
                      <FieldError name="street" />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-700">
                        City <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          <i className="fas fa-city text-sm" />
                        </span>
                        <input
                          type="text"
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Colombo"
                          autoComplete="address-level2"
                          className={fieldClass("city")}
                        />
                        <CheckIcon name="city" />
                      </div>
                      <FieldError name="city" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Security */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="fas fa-shield-alt text-blue-400" />
                  Account Security
                </p>
                <div className="flex flex-col gap-4">
                  {/* Password */}
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Password <span className="text-red-500">*</span>
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
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
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
                    <FieldError name="password" />

                    {/* Password strength bar */}
                    {form.password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Strength</span>
                          <span
                            className={`text-xs font-medium ${
                              strength.label === "Weak"
                                ? "text-red-500"
                                : strength.label === "Fair"
                                ? "text-orange-500"
                                : strength.label === "Good"
                                ? "text-yellow-600"
                                : strength.label === "Strong"
                                ? "text-blue-600"
                                : "text-green-600"
                            }`}
                          >
                            {strength.label}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                            style={{ width: strength.width }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                          Use 8+ characters with uppercase, numbers &amp; symbols.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <i className="fas fa-lock text-sm" />
                      </span>
                      <input
                        type={showConfirm ? "text" : "password"}
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        className={`${fieldClass("confirmPassword")} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        <i className={`fas ${showConfirm ? "fa-eye-slash" : "fa-eye"} text-sm`} />
                      </button>
                    </div>
                    <FieldError name="confirmPassword" />
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div>
                <label
                  className={`flex items-start gap-3 cursor-pointer select-none text-sm ${
                    touched.agreeTerms && errors.agreeTerms ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={form.agreeTerms}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-4 h-4 mt-0.5 accent-blue-600 flex-shrink-0"
                  />
                  <span>
                    I agree to the{" "}
                    <a href="#" className="text-blue-600 font-medium hover:underline">
                      Terms &amp; Conditions
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-blue-600 font-medium hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                <FieldError name="agreeTerms" />
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
                    Creating Account…
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus" />
                    Create Account
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
                <span className="bg-white px-3 text-gray-400">Already have an account?</span>
              </div>
            </div>

            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all"
            >
              <i className="fas fa-sign-in-alt" />
              Sign In Instead
            </Link>

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

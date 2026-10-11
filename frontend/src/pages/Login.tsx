import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Zap,
  Moon,
  Sun,
} from "lucide-react";
import API from "../api";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "SALES">("SALES");
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegister && !name)) {
      showToast("Please fill in all required fields.", "warning");
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const payload = isRegister
        ? { name, email, password, role }
        : { email, password };

      const res = await API.post(endpoint, payload);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role || "SALES");
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      showToast(
        isRegister ? "Account created! Welcome to Smart Lead CRM." : "Login successful! Welcome back.",
        "success"
      );

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 400);
    } catch (error: any) {
      console.error(error);
      const isNetworkError = error.code === "ERR_NETWORK" || !error.response;
      const msg = isNetworkError
        ? "Unable to reach backend server. Please verify backend is running on port 5000."
        : error.response?.data?.message || "Authentication failed. Please check credentials.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoRole: "ADMIN" | "SALES") => {
    setLoading(true);
    const demoEmail = demoRole === "ADMIN" ? "rahul@gmail.com" : "priya@sales.com";
    const demoPassword = "123456";

    setEmail(demoEmail);
    setPassword(demoPassword);

    try {
      const res = await API.post("/auth/login", {
        email: demoEmail,
        password: demoPassword,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role || demoRole);
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      showToast(`Logged in as ${demoRole === "ADMIN" ? "Admin (Rahul Sharma)" : "Sales Rep (Priya Patel)"}!`, "success");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 400);
    } catch (error: any) {
      console.error(error);
      const isNetworkError = error.code === "ERR_NETWORK" || !error.response;
      const msg = isNetworkError
        ? "Cannot connect to backend server. Ensure backend is running on port 5000."
        : error.response?.data?.message || "Demo login failed.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 flex flex-col justify-center items-center p-4 relative font-sans text-slate-900 dark:text-white transition-colors">
      {/* Dark mode switch button top right */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
        title="Toggle Dark / Light Theme"
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600" />
        )}
      </button>

      {/* Decorative Orbs */}
      <div className="absolute top-12 left-1/4 w-80 h-80 bg-indigo-200/50 dark:bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-1/4 w-80 h-80 bg-blue-200/50 dark:bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-6 text-center z-10 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800/80 shadow-sm text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-3">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Smart Lead Dashboard CRM</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          Smart Sales & Lead Management
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
          Automated AI scoring, stage tracking, and instant 1-click workflows.
        </p>
      </div>

      {/* Main Glass/White Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-7 sm:p-8 shadow-xl shadow-indigo-100/60 dark:shadow-none z-10 transition-colors">
        {/* 1-Click Instant Demo Access */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-blue-50/80 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-100 dark:border-indigo-900/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-2.5">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>1-Click Instant Demo Login:</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("ADMIN")}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all transform active:scale-95 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin (Rahul)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("SALES")}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm transition-all transform active:scale-95 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Sales (Priya)</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher (Sign In / Register) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-5 border border-slate-200/80 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isRegister
                ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isRegister
                ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required={isRegister}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "ADMIN" | "SALES")}
                className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="SALES">Sales Representative (Create & Manage Leads)</option>
                <option value="ADMIN">Admin Manager (Full Access & Delete)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md shadow-indigo-200 dark:shadow-none transition-all transform active:scale-98 cursor-pointer mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegister ? "Register & Enter Dashboard" : "Sign In to Dashboard"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Credentials Info */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Demo Credentials:</p>
          <p className="text-slate-600 dark:text-slate-400">
            Admin: <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">rahul@gmail.com</span> (Password: <span className="font-mono font-bold">123456</span>)
          </p>
          <p className="text-slate-600 dark:text-slate-400 mt-0.5">
            Sales: <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">priya@sales.com</span> (Password: <span className="font-mono font-bold">123456</span>)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect if unauthorized and user is inside the dashboard
    if (error.response?.status === 401) {
      const isAuthRoute =
        error.config?.url?.includes("/auth/login") ||
        error.config?.url?.includes("/auth/register");

      if (!isAuthRoute && window.location.pathname !== "/" && window.location.pathname !== "") {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
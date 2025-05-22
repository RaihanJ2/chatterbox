import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

axios.defaults.withCredentials = true;

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getSession = async () => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return { user: null };
    }
    const response = await axios.get(`${API_URL}/api/auth/profile`);
    if (response.data) {
      return {
        user: {
          id: response.data._id,
          name: response.data.username,
          email: response.data.email,
          image: response.data.image,
        },
      };
    }
    return { user: null };
  } catch (error) {
    console.error("Failed to get session:", error);
    return { user: null };
  }
};

export const logout = async () => {
  try {
    await axios.post(`${API_URL}/api/auth/logout`);
    localStorage.removeItem("authToken");
    return true;
  } catch (error) {
    console.error("Failed to logout:", error);
    return false;
  }
};

export const handleAuthCallback = (token: string) => {
  localStorage.setItem("authToken", token);
};

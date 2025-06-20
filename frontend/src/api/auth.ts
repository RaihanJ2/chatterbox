import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("Unauthorized access detected");
    }
    return Promise.reject(error);
  }
);

export const getSession = async () => {
  try {
    const response = await axiosInstance.get("/api/auth/profile");
    if (response.data) {
      return {
        user: {
          id: response.data._id,
          name: response.data.username,
          email: response.data.email,
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
    await axiosInstance.post("/api/auth/logout");
    return true;
  } catch (error) {
    console.error("Failed to logout:", error);
    return false;
  }
};

export const login = async (email: string) => {
  try {
    const response = await axiosInstance.post("/api/auth/login", { email });
    return response.data;
  } catch (error) {
    console.error("Failed to login:", error);
    throw error;
  }
};

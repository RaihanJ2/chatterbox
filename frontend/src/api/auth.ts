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

export const getSession = async () => {
  try {
    const response = await axiosInstance.get(`${API_URL}/api/auth/profile`);
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
    await axios.post(`${API_URL}/api/auth/logout`);
    return true;
  } catch (error) {
    console.error("Failed to logout:", error);
    return false;
  }
};

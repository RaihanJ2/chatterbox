import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { handleAuthCallback } from "../api/auth";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      handleAuthCallback(token);
      navigate("/");
    } else {
      navigate("/");
      console.error("not token");
    }
  }, [navigate]);
  return (
    <div className="flex items-center justify-center h-screen bg-[#432439]">
      <div className="text-[#c1a57b] text-xl">Processing Login...</div>
    </div>
  );
};
export default AuthCallback;

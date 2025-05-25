import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Since we're using session-based auth, we just need to redirect back to home
    // The session will be automatically handled by the backend
    navigate("/");
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-primary">
      <div className="text-light text-xl">Processing Login...</div>
    </div>
  );
};

export default AuthCallback;

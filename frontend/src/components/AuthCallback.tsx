import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-primary">
      <div className="text-highlight text-xl">Processing Login...</div>
    </div>
  );
};

export default AuthCallback;

import React, { useEffect, useState } from "react";
import { signInWithGoogle } from "../../firebaseconfig"; // Firebase Google login method
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const [redirected, setRedirected] = useState(false); // Prevent multiple redirects

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !redirected && location.pathname !== "/linkpage") {
        const storedUUID = localStorage.getItem("UUID");
        
        if (!storedUUID || storedUUID !== user.uid) {
          const tokenId = await user.getIdToken();
          localStorage.setItem("UUID", user.uid);
          localStorage.setItem("AuthToken", tokenId);
        }

        setRedirected(true); // Prevent multiple redirects
        navigate("/linkpage");
      }
    });

    return () => unsubscribe();
  }, [auth, navigate, redirected, location.pathname]);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      console.log("Google login result user:", result.user);

      const tokenId = await result.user.getIdToken();
      const userId = result.user.uid;

      // Store token and UID
      localStorage.setItem("AuthToken", tokenId);
      localStorage.setItem("UUID", userId);

      navigate("/linkpage"); // Redirect after successful login
    } catch (error) {
      console.error("Google registration error:", error.message);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <button onClick={handleGoogleLogin}>Register with Google</button>
    </div>
  );
};

export default Register;

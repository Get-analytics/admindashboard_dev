import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  getRedirectResult,
} from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { FaApple, FaMicrosoft } from "react-icons/fa";
import "./Login.css"; // Enhanced CSS

const Login = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const [loading, setLoading] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setLoading(true);
          const token = await user.getIdToken();
          localStorage.setItem("UUID", user.uid);
          localStorage.setItem("AuthToken", token);
          navigate("/linkpage", { replace: true });
        } catch (error) {
          console.error("Error fetching token:", error);
          localStorage.removeItem("UUID");
          localStorage.removeItem("AuthToken");
        } finally {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  // Handle redirect results
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Redirect login success:", result.user);
          result.user.getIdToken().then((tokenId) => {
            localStorage.setItem("AuthToken", tokenId);
          });
          localStorage.setItem("UUID", result.user.uid);
          navigate("/linkpage", { replace: true });
        }
      })
      .catch((error) => {
        console.error("Redirect login error:", error);
      });
  }, [auth, navigate]);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      if (!result.user) throw new Error("No user found");
      console.log("User logged in:", result.user);
      result.user.getIdToken().then((tokenId) => {
        localStorage.setItem("AuthToken", tokenId);
      });
      localStorage.setItem("UUID", result.user.uid);
      navigate("/linkpage", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === "auth/popup-closed-by-user") {
        console.warn("Popup login failed, switching to redirect login...");
        signInWithRedirect(auth, provider);
      } else if (error.code === "auth/cancelled-popup-request") {
        console.warn("Duplicate login request blocked.");
      } else {
        alert("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">
        Login
        <span className="underline"></span>
      </h2>
      <div className="login-buttons">
        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="login-btn google-btn"
          disabled={loading}
        >
          <FcGoogle className="login-icon" />
          {loading ? "Logging in..." : "Continue with Google"}
        </button>

        {/* Microsoft Login (UI Only) */}
        <button className="login-btn microsoft-btn" disabled>
          <FaMicrosoft className="login-icon microsoft-icon" />
          Continue with Microsoft
        </button>

        {/* Apple Login (UI Only) */}
        <button className="login-btn apple-btn" disabled>
          <FaApple className="login-icon apple-icon" />
          Continue with Apple
        </button>
      </div>
    </div>
  );
};

export default Login;

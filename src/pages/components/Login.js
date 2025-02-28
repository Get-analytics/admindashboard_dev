import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css"; // Import CSS file

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Check if the user is already logged in
  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("auth"));
    if (token) {
      toast.success("You are already logged in");
      navigate("/linkpage");
    }
  }, [navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/v1/login", { email, password });
      localStorage.setItem("AuthToken", JSON.stringify(response.data.token));
      localStorage.setItem("UUID", JSON.stringify(response.data.uuid));
      toast.success("Login successful");
      navigate("/linkpage");
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Sign In</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="input-field"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input-field"
            required
          />
          <a href="/forgot-password" className="forgot-password">Forgot password?</a>
          <button type="submit" className="login-button">Log In</button>

          <div className="separator-container">
            <span>or</span>
            <div className="separator-line"></div>
          </div>

        

          <div className="register-footer">
            <span>Don't have an account? <a href="/register" className="register-link">Register here</a></span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

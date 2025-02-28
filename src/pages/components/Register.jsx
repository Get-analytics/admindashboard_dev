import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import "./Register.css"; // Import CSS file

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Check if the user is already logged in (optional)
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
      const payload = { username, email, password };
      const response = await axios.post("http://localhost:5000/api/v1/register", payload);
      toast.success("Registration successful");
      navigate("/login"); // Redirect to login after successful registration
    } catch (error) {
      console.error("Registration Error:", error);
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Create an Account</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input
           
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="input-field"
            required
          />
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
          <button type="submit" className="login-button">Register</button>

          <div className="separator-container">
            <span>or</span>
            <div className="separator-line"></div>
          </div>

        

          <div className="login-footer">
            <span>Already have an account? <a href="/login" className="login-link">Login</a></span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

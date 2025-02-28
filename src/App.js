import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Linkpage from "./pages/Linkpage";
import Dashboard from "./pages/dashboard";
import Login from "./pages/components/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import IframeView from '../src/pages/components/InnerComponents/iframeview'
// Import your RecordProvider
import { RecordProvider } from "./context/RecordContext";
import Register from "./pages/components/Register";


function App() {
  return (
    <Router>
      {/* Wrap your Routes with RecordProvider to provide context */}
      <RecordProvider>
        <div>
          <Routes>
            <Route path="/" element={<Navigate to="/linkpage" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/linkpage" element={<Linkpage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/iframeview" element={<IframeView />} />
          </Routes>
        </div>
        {/* ToastContainer for notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </RecordProvider>
    </Router>
  );
}

export default App;

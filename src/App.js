import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseconfig";
import Linkpage from "./pages/Linkpage";
import Dashboard from "./pages/dashboard";
import Login from "./pages/components/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import IframeView from "./pages/components/InnerComponents/iframeview";
import { RecordProvider } from "./context/RecordContext";
import Register from "./pages/components/Register";
import LoadingWave from "./pages/components/Loader/Loader";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser);
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingWave></LoadingWave>;
  }

  return (
    <Router>
      <RecordProvider>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/linkpage" replace /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={user ? <Navigate to="/linkpage" replace /> : <Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/linkpage" element={user ? <Linkpage /> : <Navigate to="/login" replace />} />
          <Route path="/dashboard/:category/:analyticsId" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/iframeview" element={<IframeView />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={5000} />
      </RecordProvider>
    </Router>
  );
};

export default App;

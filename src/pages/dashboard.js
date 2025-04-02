import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./dashboard.css";
import Notch from "./components/notch";
import Metrics from "./components/Metrics";
import HeatmapCard from "./components/HeatmapCard";
import Mostviewedpage from "./components/InnerComponents/Mostviewedpage";
import TrafficSource from "./components/map";
import Timespend from "./components/InnerComponents/Timespend";
import Session from "./components/InnerComponents/session";
import Device from "./components/InnerComponents/device";
import { useRecordContext } from "../context/RecordContext";
import VideoWithAdvancedFeatures from "./components/Videoview";

const Dashboard = () => {
  const { category, analyticsId } = useParams();
  const navigate = useNavigate();
  const { record, saveRecord } = useRecordContext();
  const [activeMatrix, setActiveMatrix] = useState("default");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log(user, "userssssss");

      if (!user) {
        navigate("/login");
      } else {
        setUser(user); // Store user data in state
        console.log("User data:", {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });

        // Get a fresh token from Firebase instead of localStorage
        const token = await user.accessToken
        console.log("Fetched token:", token);

        // Check and save record only if it doesn't exist
        if (!record && category && analyticsId) {
          const newRecord = {
            category: category.toLowerCase(),
            uuid: analyticsId,
            url: window.location.pathname,
            userInfo: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              token, // using the freshly fetched token
            },
          };
          console.log(newRecord, "new record");
          saveRecord(newRecord);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [category, analyticsId, record, saveRecord, navigate]);

  useEffect(() => {
    if (record) {
      console.log(record, "final record");
    }
  }, [record]);

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  const renderMainContent = () => {
    if (!record) {
      return <div className="error-message">No valid record found</div>;
    }

    if (activeMatrix === "Total Sessions") {
      return (
        <div className="main-content">
          <div className="heatmap-section">
            <Session />
          </div>
          <div className="right-section">
            <TrafficSource />
          </div>
        </div>
      );
    } else if (activeMatrix === "Time Spent") {
      return (
        <div className="main-content">
          <div className="heatmap-section">
            <Timespend />
          </div>
          <div className="right-section">
            <Device />
          </div>
        </div>
      );
    } else {
      return (
        <div className="main-content">
          <div className="heatmap-section">
            {record.category === "web" ? (
              <HeatmapCard />
            ) : record.category === "pdf" || record.category === "docx" ? (
              <Mostviewedpage />
            ) : record.category === "video" ? (
              <VideoWithAdvancedFeatures />
            ) : (
              <div>No valid category found</div>
            )}
          </div>
          <div className="right-section">
            <TrafficSource />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="dashboard-container">
      {/* ✅ Pass record as a prop to Notch */}
      <Notch record={record} />
      <div className="top-metrics">
        <Metrics setActiveMatrix={setActiveMatrix} activeMatrix={activeMatrix} />
      </div>
      {renderMainContent()}
    </div>
  );
};

export default Dashboard;

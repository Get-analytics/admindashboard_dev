import React, { useState } from "react";
import "./dashboard.css";
import Notch from "./components/notch";
import Metrics from "./components/Metrics";
import HeatmapCard from "./components/HeatmapCard";
import Mostviewedpage from "./components/InnerComponents/Mostviewedpage";
import TrafficSource from "./components/map";
import Timespend from "./components/InnerComponents/Timespend";
import Session from "./components/InnerComponents/session";
import Device from "./components/InnerComponents/device";
import { useRecordContext } from "../context/RecordContext"; // Import context
import VideoWithAdvancedFeatures from "./components/Videoview";


const Dashboard = () => {
  const { record } = useRecordContext();
  const { category } = record || {}; // Get category from record

  const [activeMatrix, setActiveMatrix] = useState("default");

  // Dynamically select component based on category
  const renderMainContent = () => {
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
      // Dynamically render components based on category
      return (
        <div className="main-content">
          <div className="heatmap-section">
            {/* Render different components based on category */}
            {category?.toLowerCase() === "web" ? (
              <HeatmapCard /> // For web category, render HeatmapCard
            ) : category?.toLowerCase() === "pdf" || category?.toLowerCase() === "docx" ? (
              <Mostviewedpage /> // For pdf or docx category, render Mostviewedpage
            ) : category?.toLowerCase() === "video" ? (
              <VideoWithAdvancedFeatures /> // For video category, render VideoWithAdvancedFeatures
            ) : (
              <div>No valid category found</div> // Fallback if no valid category
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
      <Notch />
      <div className="top-metrics">
        <Metrics setActiveMatrix={setActiveMatrix} activeMatrix={activeMatrix} />
      </div>
      {renderMainContent()}
    </div>
  );
};

export default Dashboard;

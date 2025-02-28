import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./Mostviewpage.css";
import { useRecordContext } from "../../../context/RecordContext";

const Mostviewpage = () => {
  const { record } = useRecordContext();
  const { uuid, token, url, category } = record || {};
  console.log( uuid, token, url, category , "datafrom mostviewed")

  const [analyticsData, setAnalyticsData] = useState(null); // State to hold the response data
  const [loading, setLoading] = useState(true); // Loading state to show a loader until data is fetched
  const [currentTextIndex, setCurrentTextIndex] = useState(0); // State for navigating between selected texts

  // Fetch analytics data when component mounts
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        if (!uuid || !token || !url || !category) return;
  
        // Determine the API endpoint dynamically
        const endpoint =
          category === "Docx" || category === "Doc"
            ? "http://localhost:5000/api/v1/docx/viewanalytics"
            : "http://localhost:5000/api/v1/pdf/viewanalytics";
  
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uuid, token, url, category }),
        });
  
        const data = await response.json();
        setAnalyticsData(data); // Set the response data to state
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false); // Set loading to false once data is fetched
      }
    };
  
    fetchAnalyticsData();
  }, [uuid, token, url, category]); // Fetch data when any of these values change
  
  if (loading) {
    return <div>Loading...</div>; // Show loading message while waiting for data
  }

  // Extract data from the response
  const { totalPageTime, mostSelectedTexts, totalPages, averageTimeReadable } = analyticsData || {};

  // Prepare data for the bar chart dynamically
// Prepare data for the bar chart dynamically
// Prepare data for the bar chart dynamically
const pageData = Object.entries(totalPageTime || {}).map(([page, timeInSeconds]) => {
  // Convert seconds to hours, minutes, and seconds
  const hours = Math.floor(timeInSeconds / 3600); // 3600 seconds in an hour
  const minutes = Math.floor((timeInSeconds % 3600) / 60); // Remainder in minutes
  const seconds = timeInSeconds % 60; // Remainder in seconds
  
  // Store the formatted time in hours, minutes, and seconds
  const formattedTime = `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`;

  return {
    page: `Page ${page}`,
    time: timeInSeconds / 60, // Still use minutes for the chart
    timeFormatted: formattedTime, // Store the formatted time
  };
});


  // Handle navigating to the next or previous selected text
  const handleNavigation = (direction) => {
    if (mostSelectedTexts && mostSelectedTexts.length > 0) {
      const newIndex = currentTextIndex + direction;
      if (newIndex >= 0 && newIndex < mostSelectedTexts.length) {
        setCurrentTextIndex(newIndex);
      }
    }
  };

  // Get the current selected text for the display
  const currentSelectedText = mostSelectedTexts && mostSelectedTexts[currentTextIndex];

  // Function to truncate text to 250 characters and add ellipsis if it's too long
  const truncateText = (text) => {
    if (text && text.length > 200) {
      return text.slice(0, 200) + "...";
    }
    return text;
  };

  // Format the average time into a readable string
  const formatTime = (timeObj) => {
    const { hours, minutes, seconds } = timeObj || {};
    return `${hours > 0 ? hours + 'h ' : ''}${minutes > 0 ? minutes + 'm ' : ''}${seconds}s`;
  };

  return (
    <div className="analytics-container">
      {/* Header with Icon and Sub-heading */}
      <div className="session-header">
        <div className="session-icon">
          <img src="search.svg" alt="Expand" />
        </div>
        <div className="sub-heading">
          <p className="click-count">Most viewed Page</p>
        </div>
      </div>

      {/* Most Viewed Page Section */}
      <div className="page-views">
        <div className="details-container">
          <div className="file-info">
            <img src="image.png" alt="PDF Icon" className="file-image" />
            <div className="text-info">
              <p className="duration">{formatTime(averageTimeReadable)}</p>
              <p className="average-time">Avg Time Spend</p>
              <p className="page-id">Total Pages: {totalPages}</p>
            </div>
          </div>
          <div className="graph-container">
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={pageData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="page"
                  tick={{ fill: "#7C5832", fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: "#7C5832" }}
                  tickLine={false}
                />
                <YAxis hide={true} domain={[0, "dataMax + 2"]} />
                <Tooltip
                  formatter={(value, name, props) => {
                    // Get the formatted time for the tooltip
                    const { timeFormatted } = props.payload || {};
                    return [`${timeFormatted}`, "Time Spent"]; // Display formatted time
  }}
  
  labelStyle={{ color: "#fff" }}
  cursor={{ fill: "rgba(0,0,0,0.1)" }}
/>


                <Bar dataKey="time" fill="#7C5832" barSize={20} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="graph-caption">Least to most pages from this PDF</p>
          </div>
        </div>
      </div>

      {/* Most Selected Text Section */}
      <div className="highlighted-text">
        <h2 className="title-header">Most Selected Text</h2>
        {currentSelectedText ? (
          <div className="text-box">
            <p className="quote-text">{truncateText(currentSelectedText.selectedText)}</p>
            <div className="page-details">
              <p className="page-tag">Page</p>
              <p className="page-number">{currentSelectedText.page}</p>
              <div className="navigation-buttons">
                <button
                  className="button-nav"
                  onClick={() => handleNavigation(-1)}
                  disabled={currentTextIndex === 0}
                >
                  {"<"}
                </button>
                <button
                  className="button-nav"
                  onClick={() => handleNavigation(1)}
                  disabled={currentTextIndex === mostSelectedTexts.length - 1}
                >
                  {">"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p>No highlighted text available.</p>
        )}
      </div>
    </div>
  );
};

export default Mostviewpage;

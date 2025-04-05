

import React, { useEffect, useState } from "react";
import "./Metrics.css"; // Import CSS styles for Metrics
import { Link } from "react-router-dom";
import { useRecordContext } from "../../context/RecordContext";
import { useSpring, animated } from "@react-spring/web";
import {
  TeamOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PieChartOutlined,
  RightOutlined,
} from "@ant-design/icons";

// ----------------------------------------------------
// Metrics Configuration: defines the four metric cards.
// ----------------------------------------------------
const metrics = [
  {
    title: "Total Sessions",
    value: "0",
    icon: <TeamOutlined style={{ fontSize: "24px", color: "#6C4E2A" }} />,
    showLink: true,
  },
  {
    title: "Time Spent",
    value: "0h 0m",
    icon: <ClockCircleOutlined style={{ fontSize: "24px", color: "#6C4E2A" }} />,
    showLink: true,
  },
  {
    title: "Unique Visitors",
    value: "0",
    icon: <UserOutlined style={{ fontSize: "24px", color: "#6C4E2A" }} />,
    showLink: false,
  },
  {
    title: "Bounce Rate",
    value: "0%",
    icon: <PieChartOutlined style={{ fontSize: "24px", color: "#6C4E2A" }} />,
    showLink: false,
  },
];

// ----------------------------------------------------
// Default metric values to be used in case of API error.
// ----------------------------------------------------
const defaultMetrics = {
  totalsession: 0,
  totalTimeSpent: 0,
  bounceRate: 0,
  uniqueVisitors: 0,
  returnedVisitors: 0,
};

// ----------------------------------------------------
// Metrics Component
// ----------------------------------------------------
export default function Metrics({ setActiveMatrix, activeMatrix }) {
  // Retrieve record context, which includes API parameters.
  const { record } = useRecordContext();
  console.log("Record context:", record);


  const { url, category, userInfo } = record || {};
  const uuid = userInfo ? userInfo.uid : "";
  const token = userInfo ? userInfo.usertoken : "";
  console.log("Derived values:", { uuid, token, url, category });

  // State to store API data and control loading/error states.
  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataReceived, setDataReceived] = useState(false);

  // State for animated values to drive animations.
  const [animatedValues, setAnimatedValues] = useState({
    totalSessions: 0,
    uniqueVisitors: 0,
    returnedVisitors: 0,
    bounceRate: 0,
    totalTimeSpent: 0,
  });

  // ----------------------------------------------------
  // Fetch analytics data from the backend.
  // ----------------------------------------------------
  useEffect(() => {
    if (uuid && url && category) {
      const fetchAnalyticsData = async () => {
        try {
          setLoading(true);
          setError(null);

          // Convert category if needed.
          const updatedCategory = category === "Web" ? "weblink" : category;
          const apiEndpoints = {
            pdf: "https://admin-dashboard-backend-rust.vercel.app/api/v1/pdf/analytics",
            weblink: "https://admin-dashboard-backend-rust.vercel.app/api/v1/web/analytics",
            web: "https://admin-dashboard-backend-rust.vercel.app/api/v1/web/analytics",
            video: "https://admin-dashboard-backend-rust.vercel.app/api/v1/video/analytics",
            docx: "https://admin-dashboard-backend-rust.vercel.app/api/v1/docx/analytics",
          };

          const apiUrl = apiEndpoints[updatedCategory];
          if (!apiUrl) throw new Error("Invalid category");

          // Build request body using the provided uuid and token.
          const requestBody = {
            uuid,
            url,
            category: updatedCategory,
            ...(token && { token }),
          };

          console.log("Sending analytics request:", requestBody);

          // Make the API request.
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          // If the response is not OK, throw an error.
          if (!response.ok) throw new Error(`Error fetching analytics data: ${response.status}`);

          const data = await response.json();
          console.log("Analytics data fetched:", data);
          setApiData(data);
          setDataReceived(true);

          // Use lowercase category key for userCounts.
          const userCountsKey = updatedCategory.toLowerCase();

          // Update animated values from the data, or use default values.
          setAnimatedValues({
            totalSessions: data.totalsession || 0,
            uniqueVisitors: data.userCounts?.newuser?.[userCountsKey] || 0,
            returnedVisitors: data.userCounts?.returneduser?.[userCountsKey] || 0,
            bounceRate: data.bounceRate || 0,
            totalTimeSpent: data.totalTimeSpent || 0,
          });
        } catch (error) {
          console.error("API Error:", error.message);
          // In case of error, set API data and animated values to default.
          setError(error.message);
          setApiData(defaultMetrics);
          setAnimatedValues(defaultMetrics);
        } finally {
          setLoading(false);
        }
      };

      fetchAnalyticsData();
    }
  }, [uuid, token, url, category]);

  // ----------------------------------------------------
  // Helper function to format time (in seconds) into human-readable format.
  // ----------------------------------------------------
  const formatTime = (totalSeconds) => {
    if (totalSeconds < 60) {
      return `${totalSeconds.toFixed(0)} sec`;
    } else if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes} min ${seconds.toFixed(0)} sec`;
    } else {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours} hrs ${minutes.toFixed(1)} min`;
    }
  };

  // ----------------------------------------------------
  // Extract metric values from API data or default metrics.
  // ----------------------------------------------------
  const { totalsession, totalTimeSpent, bounceRate, returnedVisitors } = apiData || defaultMetrics;
  const totalTimeSpentFormatted = formatTime(totalTimeSpent);

  // ----------------------------------------------------
  // Setup react-spring for animated metric values.
  // ----------------------------------------------------
  const [uniqueVisitorsClicked, setUniqueVisitorsClicked] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const springValues = useSpring({
    to: {
      totalSessions: animatedValues.totalSessions,
      uniqueVisitors: uniqueVisitorsClicked
        ? animatedValues.returnedVisitors
        : animatedValues.uniqueVisitors,
      bounceRate: animatedValues.bounceRate,
      totalTimeSpent: animatedValues.totalTimeSpent,
    },
    from: {
      totalSessions: 0,
      uniqueVisitors: 0,
      bounceRate: 0,
      totalTimeSpent: 0,
    },
    config: { duration: 1000 },
    reset: dataReceived && !animationComplete,
    onRest: () => {
      if (!animationComplete) {
        setAnimationComplete(true);
      }
    },
  });

  // ----------------------------------------------------
  // Build updated metrics array for rendering.
  // ----------------------------------------------------
  const updatedMetrics = metrics.map((item) => {
    let updatedTitle = item.title;
    if (item.title === "Unique Visitors" && uniqueVisitorsClicked) {
      updatedTitle = "Returned Visitors";
    }
    switch (updatedTitle) {
      case "Total Sessions":
        return { ...item, value: totalsession.toString() };
      case "Unique Visitors":
        return {
          ...item,
          value: uniqueVisitorsClicked
            ? (returnedVisitors || 0).toString()
            : (animatedValues.uniqueVisitors || 0).toString(),
        };
      case "Bounce Rate":
        return { ...item, value: `${animatedValues.bounceRate.toFixed(1)}%` };
      case "Time Spent":
        return { ...item, value: totalTimeSpentFormatted };
      default:
        return item;
    }
  });


  return (
    <div className="metrics-container">
      <h2>Metrics</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="error">Data not available. Showing default values.</div>}
      <div className="metrics-grid">
        {updatedMetrics.map((item, index) => (
          <div
            key={index}
            className={`metric-card ${activeMatrix === item.title ? "active" : ""}`}
            onClick={() => {
              if (item.title === "Unique Visitors") {
                setUniqueVisitorsClicked(!uniqueVisitorsClicked);
              }
              if (item.showLink) {
                setActiveMatrix(item.title);
              }
            }}
          >
            <div className="metric-icon">{item.icon}</div>
            <div className="metric-content">
              <p className="metric-title">
                {item.title === "Unique Visitors" && uniqueVisitorsClicked
                  ? "Returned Visitors"
                  : item.title}
              </p>
              <h2 className="metric-value">
                <animated.div>
                  {item.title === "Total Sessions" && (
                    <animated.span>
                      {springValues.totalSessions.to((val) => Math.floor(val))}
                    </animated.span>
                  )}
                  {item.title === "Unique Visitors" && (
                    <animated.span>
                      {springValues.uniqueVisitors.to((val) => Math.floor(val))}
                    </animated.span>
                  )}
                  {item.title === "Bounce Rate" && (
                    <animated.span>
                      {springValues.bounceRate.to((val) => `${val.toFixed(1)}%`)}
                    </animated.span>
                  )}
                  {item.title === "Time Spent" && (
                    <animated.span>
                      {springValues.totalTimeSpent.to((val) => formatTime(val))}
                    </animated.span>
                  )}
                </animated.div>
              </h2>
            </div>
            {(item.title === "Total Sessions" || item.title === "Time Spent") && (
              <img src="/export.svg" alt="Export icon" className="export-icon" />
            )}
            {item.showLink &&
              item.title !== "Total Sessions" &&
              item.title !== "Time Spent" && (
                <Link to="/details" className="metric-link">
                  <RightOutlined />
                </Link>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}



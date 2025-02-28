import React, { useEffect, useState } from "react";
import "./Metrics.css";
import { useLocation, Link } from "react-router-dom";
import { useRecordContext } from "../../context/RecordContext";
import { useSpring, animated } from "@react-spring/web"; // Import react-spring

const metrics = [
  { title: "Total Sessions", value: "0", icon: "group.svg", showLink: true },
  { title: "Time Spent", value: "0h 0m", icon: "time.svg", showLink: true },
  { title: "Unique Visitors", value: "0", icon: "menu.svg", showLink: false },
  { title: "Bounce Rate", value: "0%", icon: "Bounce.svg", showLink: false },
];

export default function Metrics({ setActiveMatrix, activeMatrix }) {
  const { record } = useRecordContext();
  const { uuid, token, url, category } = record || {};

  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [dataReceived, setDataReceived] = useState(false);

  const [animatedValues, setAnimatedValues] = useState({
    totalSessions: 0,
    uniqueVisitors: 0,
    returnedVisitors: 0,
    bounceRate: 0,
    totalTimeSpent: 0,
  });

  const [animationComplete, setAnimationComplete] = useState(false);
  const [uniqueVisitorsClicked, setUniqueVisitorsClicked] = useState(false); // Added state for toggle

  useEffect(() => {
    if (uuid && url && category) {
      const fetchAnalyticsData = async () => {
        try {
          setLoading(true);
          setError(null);
  
          const updatedCategory = category === "Web" ? "weblink" : category;
          const apiEndpoints = {
            Pdf: "http://localhost:5000/api/v1/pdf/analytics",
            weblink: "http://localhost:5000/api/v1/web/analytics",
            Video: "http://localhost:5000/api/v1/video/analytics",
            Docx: "http://localhost:5000/api/v1/docx/analytics",
          };
  
          const apiUrl = apiEndpoints[updatedCategory];
          if (!apiUrl) throw new Error("Invalid category");
  
          const requestBody = {
            uuid,
            url,
            category: updatedCategory,
            ...(token && { token }),
          };
  
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
  
          if (!response.ok) throw new Error(`Error fetching analytics data: ${response.status}`);
  
          const data = await response.json();
          setApiData(data);
  
          setDataReceived(true);
  
          const userCountsKey = updatedCategory.toLowerCase(); // Dynamic category key, like "pdf", "video", etc.
          
          setAnimatedValues({
            totalSessions: data.totalsession || 0,
            uniqueVisitors: data.userCounts?.newuser?.[userCountsKey] || 0,
            returnedVisitors: data.userCounts?.returneduser?.[userCountsKey] || 0,
            bounceRate: data.bounceRate || 0,
            totalTimeSpent: data.totalTimeSpent || 0,
          });
        } catch (error) {
          console.error(error.message);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
  
      fetchAnalyticsData();
    }
  }, [uuid, token, url, category]);
  

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
      return `${hours}hrs ${minutes.toFixed(1)}min`;
    }
  };

  const defaultMetrics = {
    totalsession: 0,
    totalTimeSpent: 0,
    bounceRate: 0,
    uniqueVisitors: 0,
    returnedVisitors: 0,
  };

  const { totalsession, totalTimeSpent, bounceRate, returnedVisitors } = apiData || defaultMetrics;
  const totalTimeSpentFormatted = formatTime(totalTimeSpent);

  const springValues = useSpring({
    to: {
      totalSessions: animatedValues.totalSessions,
      uniqueVisitors: uniqueVisitorsClicked ? animatedValues.returnedVisitors : animatedValues.uniqueVisitors, // Toggle based on click
      bounceRate: animatedValues.bounceRate,
      totalTimeSpent: animatedValues.totalTimeSpent,
    },
    from: {
      totalSessions: 0,
      uniqueVisitors: 0,
      bounceRate: 0,
      totalTimeSpent: 0,
    },
    config: { duration: 4000 },
    reset: dataReceived && !animationComplete,
    onRest: () => {
      if (!animationComplete) {
        setAnimationComplete(true);
      }
    },
  });

  const updatedMetrics = metrics.map((item) => {
    let updatedTitle = item.title;
  
    // When the "Unique Visitors" metric is clicked, change the title
    if (item.title === "Unique Visitors" && uniqueVisitorsClicked) {
      updatedTitle = "Returned Visitors"; // Change title to "Returned Visitors"
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
    <div className="metrics-grid">
      {updatedMetrics.map((item, index) => (
        <div
          key={index}
          className={`metric-card ${activeMatrix === item.title ? "active" : ""}`}
          onClick={() => {
            if (item.title === "Unique Visitors") {
              setUniqueVisitorsClicked(!uniqueVisitorsClicked); // Toggle between unique and returned visitors on click
            }
            item.showLink && setActiveMatrix(item.title);
          }}
        >
          <div className="metric-icon">
            <img src={item.icon} alt={item.title} />
          </div>
          <div className="metric-content">
          <p className="metric-title">
  {item.title === "Unique Visitors" && uniqueVisitorsClicked
    ? "Returned Visitors" // Change title to "Returned Visitors" when clicked
    : item.title}
</p>

            <h2 className="metric-value">
              <animated.div>
                {item.title === "Total Sessions" && (
                  <animated.span>{springValues.totalSessions.to((val) => Math.floor(val))}</animated.span>
                )}
                {item.title === "Unique Visitors" && (
                  <animated.span>{springValues.uniqueVisitors.to((val) => Math.floor(val))}</animated.span>
                )}
                {item.title === "Bounce Rate" && (
                  <animated.span>{springValues.bounceRate.to((val) => `${val.toFixed(1)}%`)}</animated.span>
                )}
                {item.title === "Time Spent" && (
                  <animated.span>{springValues.totalTimeSpent.to((val) => formatTime(val))}</animated.span>
                )}
              </animated.div>
            </h2>
          </div>
          {item.showLink && (
            <Link to="/session" state={{ uuid, token, url, category }}>
              <img src="export.svg" alt="Expand" className="metric-icon-right" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

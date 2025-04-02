import React, { useEffect, useState } from "react";
import "./Metrics.css";
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

export default function Metrics({ setActiveMatrix, activeMatrix }) {
  const { record } = useRecordContext();
  console.log("Record context:", record);

  // Destructure values from record.
  // Your record format is:
  // {
  //   uuid: "video-4-https://view.sendnow.live/mJoBU",
  //   url: "/dashboard/video/mJoBU",
  //   category: "video",
  //   userInfo: {
  //     uid: "XWLEbJxLH6dlXvASX4LtVXZjH0n1",
  //     usertoken: "eyJh...lyg"
  //   }
  // }
  // Use userInfo.uid as the uuid for API calls.
  const { url, category, userInfo } = record || {};
  const uuid = userInfo ? userInfo.uid : "";
  const token = userInfo ? userInfo.usertoken : "";
  console.log("Derived values:", { uuid, token, url, category });

  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataReceived, setDataReceived] = useState(false);

  const [animatedValues, setAnimatedValues] = useState({
    totalSessions: 0,
    uniqueVisitors: 0,
    returnedVisitors: 0,
    bounceRate: 0,
    totalTimeSpent: 0,
  });

  // Fetch analytics data from backend.
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
            video: "https://admin-dashboard-backend-rust.vercel.app/api/v1/video/analytics",
            docx: "https://admin-dashboard-backend-rust.vercel.app/api/v1/docx/analytics",
          };

          const apiUrl = apiEndpoints[updatedCategory];
          if (!apiUrl) throw new Error("Invalid category");

          // Build request body using the overridden uuid and token.
          const requestBody = {
            uuid,
            url,
            category: updatedCategory,
            ...(token && { token }),
          };

          console.log("Sending analytics request:", requestBody);

          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok)
            throw new Error(`Error fetching analytics data: ${response.status}`);

          const data = await response.json();
          console.log("Analytics data fetched:", data);
          setApiData(data);
          setDataReceived(true);

          // Use lowercase category key for userCounts.
          const userCountsKey = updatedCategory.toLowerCase();

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
      return `${hours} hrs ${minutes.toFixed(1)} min`;
    }
  };

  const defaultMetrics = {
    totalsession: 0,
    totalTimeSpent: 0,
    bounceRate: 0,
    uniqueVisitors: 0,
    returnedVisitors: 0,
  };

  const { totalsession, totalTimeSpent, bounceRate, returnedVisitors } =
    apiData || defaultMetrics;
  const totalTimeSpentFormatted = formatTime(totalTimeSpent);

  // For animations
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
      {loading && <div>Loading...</div>}
      {error && <div className="error">{error}</div>}
      {apiData && (
        <div className="metrics-grid">
          {updatedMetrics.map((item, index) => (
            <div
              key={index}
              className={`metric-card ${
                activeMatrix === item.title ? "active" : ""
              }`}
              onClick={() => {
                if (item.title === "Unique Visitors") {
                  setUniqueVisitorsClicked(!uniqueVisitorsClicked);
                }
                item.showLink && setActiveMatrix(item.title);
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
                        {springValues.totalSessions.to((val) =>
                          Math.floor(val)
                        )}
                      </animated.span>
                    )}
                    {item.title === "Unique Visitors" && (
                      <animated.span>
                        {springValues.uniqueVisitors.to((val) =>
                          Math.floor(val)
                        )}
                      </animated.span>
                    )}
                    {item.title === "Bounce Rate" && (
                      <animated.span>
                        {springValues.bounceRate.to(
                          (val) => `${val.toFixed(1)}%`
                        )}
                      </animated.span>
                    )}
                    {item.title === "Time Spent" && (
                      <animated.span>
                        {springValues.totalTimeSpent.to((val) =>
                          formatTime(val)
                        )}
                      </animated.span>
                    )}
                  </animated.div>
                </h2>
              </div>
              {(item.title === "Total Sessions" ||
                item.title === "Time Spent") && (
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
      )}
    </div>
  );
}

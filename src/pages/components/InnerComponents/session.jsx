import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { useRecordContext } from "../../../context/RecordContext";
import "./session.css";

const Session = () => {
  const [selectedRange, setSelectedRange] = useState("lastMonth");
  const [sessionData, setSessionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { record } = useRecordContext();
  const { uuid, token, url, category } = record || {};

  useEffect(() => {
    if (uuid && url && category) {
      const fetchSessionData = async () => {
        try {
          setLoading(true);
          setError(null);

          const updatedCategory = category === "Web" ? "weblink" : category;
          const apiEndpoints = {
            Pdf: "http://localhost:5000/api/v1/pdf/session",
            weblink: "http://localhost:5000/api/v1/web/session",
            Video: "http://localhost:5000/api/v1/video/session",
            Docx: "http://localhost:5000/api/v1/docx/session",
          };

          const apiUrl = apiEndpoints[updatedCategory];
          if (!apiUrl) throw new Error("Invalid category");

          const requestBody = {
            uuid,
            url,
            category: updatedCategory,
            ...(token && { token }),
            dateRange: selectedRange,
          };

          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) throw new Error(`Error fetching session data: ${response.status}`);

          const result = await response.json();
          console.log("Session Data Received:", result);

          if (result.success && Array.isArray(result.data)) {
            setSessionData(result.data.length > 0 ? result.data : []);
          } else {
            throw new Error("No session data available");
          }
        } catch (error) {
          console.error(error.message);
          setError(error.message);
          setSessionData([]); // Ensures no crash even on failure
        } finally {
          setLoading(false);
        }
      };

      fetchSessionData();
    }
  }, [uuid, token, url, category, selectedRange]);

  useEffect(() => {
    console.log("Session Data (updated):", sessionData);
  }, [sessionData]);

  if (loading) return <div>Loading session data...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  // Process X-axis labels and set default values if no data
  const dates =
    sessionData.length > 0
      ? sessionData.map((item) => {
          // For "today" and "yesterday", show time ranges as part of the date
          if (selectedRange === "yesterday" || selectedRange === "today") {
            return `${item.date} ${item.timeRange}`;  // Display as Date TimeRange (e.g., "2025-02-15 00:00-12:00")
          }
          return item.date;
        })
      : ["No Data"];

  const users = sessionData.length > 0 ? sessionData.map((item) => item.users) : [0];

  // Chart configuration
  const chartData = {
    series: [
      {
        name: "Visitors",
        data: users,
      },
    ],
    options: {
      chart: {
        type: "area",
        height: 300,
        toolbar: { show: false },
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: "smooth",
        width: 2,
      },
      xaxis: {
        categories: dates,
        labels: { rotate: -45 },
      },
      colors: ["#6C4E2A"],
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.5,
          opacityTo: 0,
          stops: [0, 100],
        },
      },
      tooltip: {
        theme: "dark",
        y: { formatter: (val) => `${val} Users` },
      },
    },
  };

  return (
    <div className="session-container">
      <div className="session-header">
        <div className="session-icon">
          <img src="expanf.svg" alt="Expand" />
        </div>
        <div className="sub-heading">
          <p className="card-heading">Overall</p>
          <p className="click-count">Session</p>
        </div>
      </div>

      <div className="direction">
        <div className="session-filters" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginRight: "20px" }}>
          {["today", "yesterday", "lastWeek", "lastMonth"].map((range) => (
            <p
              key={range}
              className={selectedRange === range ? "selected" : ""}
              onClick={() => setSelectedRange(range)}
              style={{ cursor: "pointer", marginBottom: "10px" }} // Apply cursor: pointer here
            >
              {range === "today"
                ? "Today"
                : range === "yesterday"
                ? "Yesterday"
                : range === "lastWeek"
                ? "Last Week"
                : "Last Month"}
            </p>
          ))}
        </div>

        <div className="line-chart-container" style={{ flexGrow: 1 }}>
          <Chart options={chartData.options} series={chartData.series} type="area" height={300} />
        </div>
      </div>
    </div>
  );
};

export default Session;

import React, { useEffect, useState } from "react"; 
import { FieldTimeOutlined } from '@ant-design/icons'; 
import ReactApexChart from "react-apexcharts"; 
import { useRecordContext } from "../../../context/RecordContext"; 
import "./Timespend.css"; 

const Timespend = () => {
  const { record } = useRecordContext();
  const { uuid, token, url, category } = record || {};
  console.log("UUID, URL, Category, Token: ", uuid, url, category, token); 
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeUnit, setTimeUnit] = useState("seconds");

  const categoryMapping = {
    web: "weblink",
    pdf: "pdf",
    Video: "video",
    docx: "docx",
  };

  const updatedCategory = categoryMapping[category.toLowerCase()] || category;
  console.log("Updated Category: ", updatedCategory); 

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      setError(null);
  
      const apiEndpoints = {
        pdf: "https://admin-dashboard-backend-gqqz.onrender.com/api/v1/pdf/timespend",
        weblink: "https://admin-dashboard-backend-gqqz.onrender.com/api/v1/web/timespend",
        video: "https://admin-dashboard-backend-gqqz.onrender.com/api/v1/video/timespend",
        docx: "https://admin-dashboard-backend-gqqz.onrender.com/api/v1/docx/timespend",
      };
  
      const apiUrl = apiEndpoints[updatedCategory];
      if (!apiUrl) {
        console.error("Invalid category:", updatedCategory); 
        throw new Error("Invalid category");
      }
  
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
  
      if (!response.ok) throw new Error(`Error fetching session data: ${response.status}`);
  
      const result = await response.json();
      console.log("API Response:", result); 
  
      if (Array.isArray(result)) {
        const formattedData = result.map((item) => ({
          name: item.name, 
          time: item.time,  // Store original time in seconds
          originalTime: Math.round(item.time), // Round to remove decimals
        }));
        setData(formattedData);
        determineTimeUnit(formattedData);
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (error) {
      setError(error.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uuid && url && category) {
      fetchSessionData();
    }
  }, [uuid, url, category, token]);

  const determineTimeUnit = (formattedData) => {
    const maxTime = Math.max(...formattedData.map(item => item.originalTime));
    if (maxTime >= 3600) {
      setTimeUnit("hours"); // More than 1 hour
    } else if (maxTime >= 60) {
      setTimeUnit("minutes"); // More than 1 minute
    } else {
      setTimeUnit("seconds"); // Less than a minute
    }
  };

  const scaleData = (data, unit) => {
    // Scale the data based on the selected time unit
    if (unit === "hours") {
      return data.map(item => item.originalTime / 3600); // Convert to hours
    } else if (unit === "minutes") {
      return data.map(item => item.originalTime / 60); // Convert to minutes
    }
    return data.map(item => item.originalTime); // Default to seconds
  };

  const formatTime = (seconds) => {
    const roundedSeconds = Math.round(seconds); // Round to nearest integer to fix decimals
    const hours = Math.floor(roundedSeconds / 3600);
    const minutes = Math.floor((roundedSeconds % 3600) / 60);
    const remainingSeconds = roundedSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`; // Format as hours and minutes
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`; // Format as minutes and seconds
    } else {
      return `${remainingSeconds}s`; // Format as seconds
    }
  };

  const hasData = data.some((item) => item.originalTime > 0);

  // Prepare data for ApexChart
  const apexData = {
    series: [{
      name: 'Time Spent',
      data: scaleData(data, timeUnit), // Use scaled data based on the selected unit
    }],
    options: {
      chart: {
        type: 'line',
        height: 350,
        zoom: { enabled: false },
      },
      stroke: {
        curve: 'smooth',
        width: 3,
        colors: ['#6C4E2A'], // Line color
      },
      title: {
        text: 'Time Spent',
        align: 'center',
      },
      xaxis: {
        categories: data.map(item => item.name), // Map days to X-axis labels
      },
      yaxis: {
        title: { 
          text: `Time (${timeUnit})`, // Dynamically change Y-axis label
        },
        min: 0,
        labels: {
          formatter: (val) => {
            if (timeUnit === "hours") {
              return `${Math.round(val)}h`; // Format as hours
            } else if (timeUnit === "minutes") {
              return `${Math.round(val)}m`; // Format as minutes
            }
            return `${Math.round(val)}s`; // Format as seconds
          },
        },
      },
      tooltip: {
        y: {
          formatter: (val) => {
            // Tooltip formatting based on unit (seconds, minutes, or hours)
            if (timeUnit === "hours") {
              return `${Math.round(val)}h`;
            } else if (timeUnit === "minutes") {
              return `${Math.round(val)}m`;
            }
            return `${Math.round(val)}s`;
          },
        },
        theme: 'dark', // Optional: adds dark theme to the tooltip
        style: {
          fontSize: '12px',
          fontFamily: 'Arial',
        },
        marker: {
          show: true,
          fillColors: ['#6C4E2A'], // Set marker (tooltip pointer) color
        },
      },
      plotOptions: {
        line: {
          colors: ['#6C4E2A'], // Color of the line
          hover: {
            colors: ['#6C4E2A'], // Color of the line on hover
          },
        },
      },
      states: {
        hover: {
          filter: 'none', // No filter when hovering
        },
      },
    },
  };

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <div className="timeline-icon">
          <FieldTimeOutlined style={{ fontSize: '24px', color: '#6C4E2A' }} /> {/* Use FieldTimeOutlined icon */}
        </div>
        <div className="sub-heading">
          <p className="card-heading">Overall</p>
          <p className="click-count">Time Spend</p>
        </div>
      </div>

      <div className="bar-chart-container">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <div className="apexcharts-container">
            <ReactApexChart
              options={apexData.options}
              series={apexData.series}
              type="line"
              height={350}
            />
          </div>
        )}
        {!hasData && !loading && !error && (
          <p>No data available, but showing the chart with minimal height.</p>
        )}
      </div>
    </div>
  );
};

export default Timespend;

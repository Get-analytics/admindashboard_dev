import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { useRecordContext } from "../../../context/RecordContext";
import { MobileOutlined } from '@ant-design/icons'; // Import the MobileOutlined icon from Ant Design
import "./device.css";

const COLORS = ["#7C5832", "#B79F85", "#9E7C62", "#D8C4B6"];

const Device = () => {
  const { record } = useRecordContext();
  const { uuid, url, category, token } = record || {};

  const [deviceData, setDeviceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categoryMapping = {
    web: "weblink",
    pdf: "pdf",
    video: "video",
    docx: "docx",
  };

  const updatedCategory = categoryMapping[category?.toLowerCase()] || category;

  const fetchDeviceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiEndpoints = {
        pdf: "https://admin-dashboard-backend-gqqz.onrender.com/api/v1/pdf/device",
        weblink: "https://admin-dashboard-backend-gqqz.onrender.com/api/v1/web/device",
        video: "https://admin-dashboard-backend-gqqz.onrender.com/api/v1/video/device",
        docx: "https://admin-dashboard-backend-gqqz.onrender.com/api/v1/docx/device",
      };

      const apiUrl = apiEndpoints[updatedCategory];
      if (!apiUrl) throw new Error("Invalid category");

      const requestBody = { uuid, url, category: updatedCategory, ...(token && { token }) };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`Error fetching device data: ${response.status}`);

      const result = await response.json();
      console.log("Device API Response:", result);

      if (result.osData && Array.isArray(result.osData)) {
        setDeviceData(result.osData);
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (error) {
      setError(error.message);
      setDeviceData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uuid && url && category) {
      fetchDeviceData();
    }
  }, [uuid, url, category, token]);

  const chartOptions = {
    chart: {
      type: "pie",
      background: "transparent",
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 1000,
      },
    },
    labels: deviceData.map(entry => entry.name), // OS names
    colors: COLORS,
    dataLabels: {
      enabled: true,
      formatter: (val, opts) => `${opts.w.config.labels[opts.seriesIndex]}: ${val.toFixed(2)}%`,
    },
    tooltip: {
      y: {
        formatter: (val) => `${val.toFixed(2)}% Devices`,
      },
    },
    legend: {
      show: false, // Set this to false to hide the legend (dots at the bottom)
    },
  };

  const chartSeries = deviceData.map(entry => parseFloat(entry.value.toFixed(2))); // Ensure values are rounded to 2 decimals

  return (
    <div className="time-spend-card">
      <div className="time-spend-header">
        <div className="icon-background">
          <MobileOutlined style={{ fontSize: '20px', color: '#6C4E2A' }} /> {/* Use MobileOutlined icon */}
        </div>
        <div className="title-container">
          <p className="title-small">Devices Used</p>
          <h2 className="title-large">Operating Systems</h2>
        </div>
      </div>

      <div className="chart-legend-section">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : deviceData.length > 0 ? (
          <div className="chart-wrapper">
            <Chart options={chartOptions} series={chartSeries} type="pie" width="110%" height={350} />
          </div>
        ) : (
          <p>No device data available</p>
        )}
      </div>
    </div>
  );
};

export default Device;

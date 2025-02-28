import React, { useEffect, useState } from "react"; 
import { useRecordContext } from "../../../context/RecordContext"; 
import ReactApexChart from "react-apexcharts"; // Import React-ApexCharts
import "./Timespend.css"; 

const Timespend = () => {
  const { record } = useRecordContext();
  const { uuid, token, url, category } = record || {};
  console.log("UUID, URL, Category, Token: ", uuid, url, category, token); 
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        pdf: "http://localhost:5000/api/v1/pdf/timespend",
        weblink: "http://localhost:5000/api/v1/web/timespend",
        Video: "http://localhost:5000/api/v1/video/timespend",
        docx: "http://localhost:5000/api/v1/docx/timespend",
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
          time: item.time, 
        }));
        setData(formattedData);
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

  const hasData = data.some((item) => item.time > 0);

  // Prepare data for ApexChart (converting Recharts data format if necessary)
  const apexData = {
    series: [{
      name: 'Time Spent',
      data: data.map(item => item.time), // Convert time data to a format ApexCharts understands
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
        title: { text: 'Time (minutes)' },
        min: 0,
      },
      tooltip: {
        y: { formatter: val => `${val} mins` },
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
          <img src="Timespend.svg" alt="Expand" />
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

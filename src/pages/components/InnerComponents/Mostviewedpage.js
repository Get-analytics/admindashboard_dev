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
import { FileSearchOutlined } from "@ant-design/icons";
import { Modal, Table, Button } from "antd";
import "./Mostviewpage.css";
import { useRecordContext } from "../../../context/RecordContext";

const Mostviewpage = () => {
  const { record } = useRecordContext();
  // Destructure to get uid from userInfo
  const { uuid, url, category, userInfo: { uid } = {} } = record || {};
  console.log(uuid, uid, url, category, "data from most viewed");

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch analytics data when the component mounts.
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      console.log(category + " category", url + " url", "most view");
      console.log(uid + " uid", uuid + " uuid", "most view");

      try {
        if (!uuid || !url || !category || !uid) return;

        const endpoint =
          category === "docx" || category === "doc"
            ? "https://admin-dashboard-backend-rust.vercel.app/api/v1/docx/viewanalytics"
            : "https://admin-dashboard-backend-rust.vercel.app/api/v1/pdf/viewanalytics";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid, token: uid, url, category }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [uuid, uid, url, category]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Destructure analytics data.
  const {
    totalPageTime,
    mostSelectedTexts,
    mostClickedLinks,
    totalPages,
    averageTimeReadable,
  } = analyticsData || {};

  // Prepare bar chart data.
  const pageData = Object.entries(totalPageTime || {}).map(([page, timeInSeconds]) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    const formattedTime = `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`;

    return {
      page: `Page ${page}`,
      time: timeInSeconds / 60,
      timeFormatted: formattedTime,
    };
  });

  // Navigation for selected texts.
  const handleNavigation = (direction) => {
    if (mostSelectedTexts && mostSelectedTexts.length > 0) {
      const newIndex = currentTextIndex + direction;
      if (newIndex >= 0 && newIndex < mostSelectedTexts.length) {
        setCurrentTextIndex(newIndex);
      }
    }
  };

  const currentSelectedText =
    mostSelectedTexts && mostSelectedTexts[currentTextIndex];

  // Truncate text.
  const truncateText = (text) => {
    if (text && text.length > 200) {
      return text.slice(0, 200) + "...";
    }
    return text;
  };

  // Format time.
  const formatTime = (timeObj) => {
    const { hours, minutes, seconds } = timeObj || {};
    return `${hours > 0 ? hours + 'h ' : ''}${minutes > 0 ? minutes + 'm ' : ''}${seconds}s`;
  };

  // Columns for the clicked links table.
  const clickedLinksColumns = [
    {
      title: "Page",
      dataIndex: "page",
      key: "page",
      render: (page) => `Page ${page}`,
    },
    {
      title: "Link",
      dataIndex: "clickedLink",
      key: "clickedLink",
    },
    {
      title: "Count",
      dataIndex: "count",
      key: "count",
    },
  ];

  return (
    <div className="analytics-container">
      {/* Header with Icon and Sub-heading */}
      <div className="session-header">
        <div className="session-icon">
          <FileSearchOutlined style={{ fontSize: "24px", color: "#7C5832" }} />
        </div>
        <div className="sub-heading">
          <p className="click-count">Most viewed Page</p>
        </div>
      </div>

      {/* Most Viewed Page Section */}
      <div className="page-views">
        <div className="details-container">
          <div className="file-info">
            <img
              src="https://t3.ftcdn.net/jpg/02/26/42/06/360_F_226420649_vlXjp3JyUrnW5EHY00dvhbqkVdUfyafj.jpg"
              alt="PDF Icon"
              className="file-image"
            />
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
                    const { timeFormatted } = props.payload || {};
                    return [`${timeFormatted}`, "Time Spent"];
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
      <div className="highlighted-text" style={{ position: "relative" }}>
        <div className="header-with-button" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 className="title-header">Most Selected Text</h2>
          {/* New Button with custom class to open clicked links modal */}
          <Button className="custom-button" onClick={() => setIsModalVisible(true)}>
            Clicked Links
          </Button>
        </div>
        {currentSelectedText ? (
          <div className="text-box">
            <p className="quote-text">
              {truncateText(currentSelectedText.selectedText)}
            </p>
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

      {/* Modal for Clicked Links */}
      <Modal
       
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Table
          columns={clickedLinksColumns}
          dataSource={mostClickedLinks}
          rowKey={(record) => `${record.clickedLink}-${record.page}`}
          pagination={false}
        />
      </Modal>
    </div>
  );
};

export default Mostviewpage;

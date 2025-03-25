// Linkpage.js
import React, { useState, useEffect, useRef } from "react";
import "./linkpage.css";
import { toast } from "react-toastify";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Modal, Input, Space, Button, Progress, Alert } from "antd";
import {
  CopyOutlined,
  LinkOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { useNavigate } from "react-router-dom";
import DashboardTable from "./components/DashboardTable"; // Import the table component

const pageSize = 5;

const Linkpage = () => {
  // States for link generation
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // New state for file drag status
  const [isDragging, setIsDragging] = useState(false);

  // State for dashboard table data
  const [allTableData, setAllTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // States for URL column search
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");

  // State to store AuthToken and UUID
  const [userInfo, setUserInfo] = useState({ authToken: "", uuid: "" });

  const searchInput = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("AuthToken");
    const uuid = localStorage.getItem("UUID");
  
    // If no token or uuid found, navigate to login
    if (!token || !uuid) {
      navigate("/login");
    } else {
      // Only set user info if not already set to avoid infinite rerender
      if (!userInfo.authToken || !userInfo.uuid || userInfo.authToken !== token || userInfo.uuid !== uuid) {
        setUserInfo({ authToken: token, uuid: uuid });
        fetchDashboardData(token, uuid);
      }
    }
  }, [ navigate]); // Use userInfo as a dependency to avoid infinite rerenders
  
  
  

  const fetchDashboardData = async (authToken, UUID) => {
    try {
      const response = await axios.post(
        "https://admin-dashboard-backend-rust.vercel.app/api/v1/client/dashboard",
        { authToken, UUID }
      );
      if (response.status === 200) {
        const data = response.data.data;
        const flattened = flattenDashboardData(data);
        setAllTableData(flattened);
      } else {
        toast.error("Failed to fetch dashboard data.");
      }
    } catch (error) {
      toast.error("Error fetching dashboard data: " + error.message);
    }
  };

  const handleViewAnalytics = async (record) => {
    const url = record.url;
    let token = localStorage.getItem("AuthToken");
    let uuid = localStorage.getItem("UUID");
    if (uuid && token) {
      uuid = uuid.replace(/^"(.*)"$/, "$1");
      token = token.replace(/^"(.*)"$/, "$1");
    }
    const payload = { url, uuid, token };
    try {
      const response = await axios.post(
        "https://admin-dashboard-backend-gqqz.onrender.com/api/v1/analytics",
        payload
      );
      console.log("Analytics data:", response.data);
      toast.success("Analytics data fetched successfully");
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast.error("Failed to fetch analytics data");
    }
  };

  const flattenDashboardData = (data) => {
    let flattenedData = {};
    Object.keys(data).forEach((category) => {
      flattenedData[category] = data[category].map((record, index) => ({
        key: `${category}-${index}-${record.url}`,
        url: record.url,
        fileName: record.fileName, // Ensure this is preserved
        category: category,
        createdDate: record.createdDate,
        timeAgo: record.timeAgo,
      }));
    });
    return flattenedData;
  };
  

  // Handlers for URL and file input changes
  const handleUrlChange = (e) => setUrl(e.target.value);
  
  // Update file state on selection. The auto-upload is handled by the useEffect below.
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // Drag & Drop Handlers for file upload
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileAreaClick = () => {
    if (!file) {
      handleFileUploadClick();
    }
  };

  const handleCopyUrl = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("URL copied to clipboard!");
    } catch (error) {
      console.error("Error copying URL: ", error);
      toast.error("Failed to copy URL!");
    }
  };

  const parseTimeAgo = (timeAgo) => {
    if (!timeAgo) return 0;
    const parts = timeAgo.split(" ");
    if (parts.length < 3) return 0;
    const num = parseFloat(parts[0]);
    const unit = parts[1].toLowerCase();
    switch (unit) {
      case "second":
      case "seconds":
        return num;
      case "minute":
      case "minutes":
        return num * 60;
      case "hour":
      case "hours":
        return num * 3600;
      case "day":
      case "days":
        return num * 86400;
      default:
        return 0;
    }
  };

const handleGenerateLink = async (type) => {
  if (type === "url" && !url) {
    toast.warn("Please enter a URL.");
    return;
  }
  if (type === "file" && !file) {
    toast.warn("Please upload a file.");
    return;
  }
  setIsButtonDisabled(true);
  setUploading(true);
  setUploadProgress(0);

  // Function to generate 5 random alphanumeric characters
  const generateRandomId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomId = "";
    for (let i = 0; i < 5; i++) {
      randomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomId;
  };

  const randomId = generateRandomId(); // Generate 5-character random ID
  let apiEndpoint = "";
  let payload = null;
  let headers = {};

  try {
    if (type === "url") {
      apiEndpoint = "https://admin-dashboard-backend-gqqz.onrender.com/api/v1/linkupload";
      payload = { shortId: randomId, originalUrl: url, uuid: userInfo.uuid };
      headers["Content-Type"] = "application/json";
    } else if (type === "file") {
      apiEndpoint = "https://admin-dashboard-backend-gqqz.onrender.com/api/v1/fileupload";
      payload = new FormData();
      payload.append("shortId", randomId);
      payload.append("file", file);
      payload.append("uuid", userInfo.uuid);
    }
    const response = await axios.post(apiEndpoint, payload, {
      headers,
      onUploadProgress: (progressEvent) => {
        const percent = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      },
    });
    if (response.status === 200) {
      let link = "";
      if (type === "url" && response.data.shortenedUrl) {
        link = `https://filescence-rho.vercel.app/${response.data.shortenedUrl.shortId}`;
      } else if (type === "file" && response.data.shortId) {
        link = `https://filescence-rho.vercel.app/${response.data.shortId}`;
      }
      setGeneratedLink(link);
      setIsModalVisible(true);
      toast.success("Upload successful! Your shortened link is ready.");
      fetchDashboardData(userInfo.authToken, userInfo.uuid);
    } else {
      toast.error("Failed to upload.");
    }
  } catch (error) {
    toast.error("Error generating link: " + error.message);
  } finally {
    setIsButtonDisabled(false);
    setUploading(false);
    setUploadProgress(0);
    setFile(null);
    setUrl("");
  }
};


  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Error copying link: ", error);
      toast.error("Failed to copy link!");
    }
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : false,
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0] || "");
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const handleRedirect = () => {
    if (generatedLink) {
      window.open(generatedLink, "_blank");
    }
  };

  // Auto-upload when file state is updated.
  useEffect(() => {
    if (file) {
      handleGenerateLink("file");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  return (
    <div className="linkpage-container">
      <div className="linkpage-hero">
        <h1 className="linkpage-heading">Share Smarter, Track Better.</h1>
        <p className="linkpage-subheading">
          Shorten and share everything—in a single link, then dive into heat maps,
          bounce rates, and location insights to uncover the story behind every click.
        </p>
      </div>

      {/* Link Generation Container */}
      <div className="linkpage-generation" style={{ position: "relative" }}>
        {uploading && (
          <div className="linkpage-upload-overlay">
            <Progress percent={uploadProgress} status="active" strokeColor="#7C5832" />
          </div>
        )}

        {/* Left Card: URL Input */}
        <div className="linkpage-card">
          <h2 className="linkpage-card-title">Enter your URL</h2>
          <div className="linkpage-input">
            <input
              type="text"
              placeholder="Paste the URL"
              value={url}
              onChange={handleUrlChange}
            />
            <LinkOutlined
              className="linkpage-icon-button"
              onClick={() => handleGenerateLink("url")}
            />
          </div>
          <p className="linkpage-note">
            Note:<br />
            Paste any publicly accessible link to<br />
            generate a shareable short URL and<br />
            gather engagement analytics
          </p>
        </div>

        {/* Vertical Divider */}
        <div className="linkpage-divider"></div>

        {/* Right Card: File Upload with drag & drop */}
        <div
          className="linkpage-card"
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <h2 className="linkpage-card-title">Drop Your Content</h2>
          <div
            className={`linkpage-input linkpage-file-upload ${isDragging ? "dragging" : ""}`}
            onClick={handleFileAreaClick}
          >
            <span>{file ? file.name : "Upload Your Files"}</span>
            {file ? (
              <LinkOutlined className="linkpage-icon-button" />
            ) : (
              <div className="linkpage-icon-wrapper">
                <img
                  src="/upload copy.svg"
                  alt="Upload Icon"
                  className="linkpage-dropdown-icon"
                />
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="linkpage-file-input"
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept=".jpg,.png,.pdf,.docx,.mp4"
          />
          <p className="linkpage-note">
            Note:<br />
            Upload PDFs, Docs, Images, or videos.<br />
            Maximum file size varies by plan—upgrade anytime for<br />
            higher limits and advanced analytics.
          </p>
        </div>
      </div>

      {/* Dashboard Table Section */}
      <DashboardTable
        data={allTableData}
        currentPage={currentPage}
        pageSize={pageSize}
        setCurrentPage={setCurrentPage}
        getColumnSearchProps={getColumnSearchProps}
        parseTimeAgo={parseTimeAgo}
        handleCopyUrl={handleCopyUrl}
        handleViewAnalytics={handleViewAnalytics}
      />

      {/* Modal for Generated Link */}
      <Modal
        title="Generated Link"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        centered
      >
        <Input
          value={generatedLink}
          readOnly
          addonAfter={
            <div style={{ display: "flex", gap: "10px" }}>
              <CopyOutlined onClick={handleCopy} style={{ cursor: "pointer" }} />
              <LinkOutlined onClick={handleRedirect} style={{ cursor: "pointer" }} />
            </div>
          }
        />
      </Modal>
    </div>
  );
};

export default Linkpage;

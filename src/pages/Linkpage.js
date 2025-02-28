// Linkpage.js
import React, { useState, useEffect, useRef } from "react";
import "./linkpage.css";
import { toast } from "react-toastify";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Modal, Input, Space, Button, Tooltip, Spin, Alert } from "antd";
import {
  CopyOutlined,
  LinkOutlined,
  CloudUploadOutlined,
  EyeOutlined,
  DeleteOutlined,
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
  // Loader state during uploads
  const [uploading, setUploading] = useState(false);

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

  // (Optional) Custom Alert Component
  const AlertNoti = () => {
    return <Alert message="Success Text" type="success" />;
  };

  // On component mount, retrieve AuthToken and UUID from localStorage and store in state.
  useEffect(() => {
    let token = localStorage.getItem("AuthToken");
    let uuid = localStorage.getItem("UUID");
    if (!token || !uuid) {
      navigate("/login");
    } else {
      uuid = uuid ? uuid.replace(/^"(.*)"$/, "$1") : "";
      token = token ? token.replace(/^"(.*)"$/, "$1") : "";
      setUserInfo({ authToken: token, uuid: uuid });
      // Delay API call by 3 seconds
      setTimeout(() => {
        fetchDashboardData(token, uuid);
      }, 3000);
    }
  }, [navigate]);

  // Fetch dashboard data and flatten it
  const fetchDashboardData = async (authToken, UUID) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/v1/client/dashboard",
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
    // Extract URL from the clicked row record.
    const url = record.url;

    // Get the token and UUID from localStorage.
    let token = localStorage.getItem("AuthToken");
    let uuid = localStorage.getItem("UUID");
    if (uuid && token) {
      // Remove any extra quotes if necessary.
      uuid = uuid.replace(/^"(.*)"$/, "$1");
      token = token.replace(/^"(.*)"$/, "$1");
    }

    // Prepare the payload
    const payload = {
      url, // URL from the clicked row
      uuid, // User's UUID
      token, // Auth Token
    };

    try {
      const response = await axios.post(
        "http://localhost:5000/api/v1/analytics",
        payload
      );
      // Process the response as needed:
      console.log("Analytics data:", response.data);
      toast.success("Analytics data fetched successfully");
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast.error("Failed to fetch analytics data");
    }
  };

  // Flatten data from each category into one array.
  // Each record now includes: url, category, createdDate, and timeAgo.
  const flattenDashboardData = (data) => {
    let flat = [];
    ["web", "docx", "pdf", "video"].forEach((category) => {
      if (Array.isArray(data[category])) {
        data[category].forEach((item, index) => {
          flat.push({
            key: `${category}-${index}-${item.url}`, // Ensure key is unique
            url: item.url,
            category: category.charAt(0).toUpperCase() + category.slice(1),
            // Convert to full ISO string to help with sorting
            createdDate: new Date(item.createdDate).toISOString(),
            timeAgo: item.timeAgo, // Use backend precomputed timeAgo value
          });
        });
      }
    });
    return flat;
  };

  // Handlers for URL and file input changes
  const handleUrlChange = (e) => setUrl(e.target.value);
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Open the file manager
  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // If a file is selected, clicking the area triggers upload; otherwise, open the file manager.
  const handleFileAreaClick = () => {
    if (file) {
      handleGenerateLink("file");
    } else {
      handleFileUploadClick();
    }
  };

  // Function to copy a given URL to the clipboard (for table URLs)
  const handleCopyUrl = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("URL copied to clipboard!");
    } catch (error) {
      console.error("Error copying URL: ", error);
      toast.error("Failed to copy URL!");
    }
  };

  // Helper function to parse the "timeAgo" string into seconds
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

  // Generate a shortened link for URL or file uploads.
  // Uses the values from userInfo (AuthToken and UUID) from state.
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

    const randomId = uuidv4();
    let apiEndpoint = "";
    let payload = null;
    let headers = {};

    try {
      if (type === "url") {
        apiEndpoint = "http://localhost:5000/api/v1/linkupload";
        payload = { shortId: randomId, originalUrl: url, uuid: userInfo.uuid };
        headers["Content-Type"] = "application/json";
      } else if (type === "file") {
        apiEndpoint = "http://localhost:5000/api/v1/fileupload";
        payload = new FormData();
        payload.append("shortId", randomId);
        payload.append("file", file);
        payload.append("uuid", userInfo.uuid);
      }
      const response = await axios.post(apiEndpoint, payload, { headers });
      if (response.status === 200) {
        let link = "";
        if (type === "url" && response.data.shortenedUrl) {
          link = `http://localhost:3000/${response.data.shortenedUrl.shortId}`;
        } else if (type === "file" && response.data.shortId) {
          link = `http://localhost:3000/${response.data.shortId}`;
        }
        setGeneratedLink(link);
        setIsModalVisible(true);
        toast.success("Upload successful! Your shortened link is ready.");

        // Immediately call fetchDashboardData using userInfo values.
        fetchDashboardData(userInfo.authToken, userInfo.uuid);
      } else {
        toast.error("Failed to upload.");
      }
    } catch (error) {
      toast.error("Error generating link: " + error.message);
    } finally {
      setIsButtonDisabled(false);
      setUploading(false);
      setFile(null);
      setUrl("");
    }
  };

  // Copy the generated link to the clipboard (from modal)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Error copying link: ", error);
      toast.error("Failed to copy link!");
    }
  };


  // ********* URL Column Search Functionality *********
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
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

  return (
    <div style={{ position: "relative" }}>
      {/* Loader Overlay */}
      {uploading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(255,255,255,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <Spin size="large" tip="Uploading..." />
        </div>
      )}
      <div className="container">
        {/* URL Input Section */}
        <div className="input-section">
          <label className="input-label">Enter the URL</label>
          <div className="input-box">
            <input
              type="text"
              placeholder="Paste the URL"
              value={url}
              onChange={handleUrlChange}
              disabled={isButtonDisabled || file}
            />
            <LinkOutlined
              className="icon-button"
              onClick={() => handleGenerateLink("url")}
            />
          </div>
          <p className="note">Paste a link to generate a shortened URL.</p>
        </div>

        <div className="divider"></div>

        {/* File Upload Section */}
        <div className="input-section">
          <label className="input-label">Drop Your Content</label>
          <div className="input-box file-upload" onClick={handleFileAreaClick}>
            <span>{file ? file.name : "Upload Your Files"}</span>
            {file ? (
              <LinkOutlined className="icon-button" />
            ) : (
              <CloudUploadOutlined className="dropdown-icon" />
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="file-input"
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept=".jpg,.png,.pdf,.docx,.mp4"
          />
          <p className="note">Upload documents, PDFs, or images for sharing.</p>
        </div>

        {/* Modal to Display Generated Link */}
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
              <CopyOutlined onClick={handleCopy} style={{ cursor: "pointer" }} />
            }
          />
        </Modal>
      </div>

      {/* Render the table as a separate component */}
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
    </div>
  );
};

export default Linkpage;

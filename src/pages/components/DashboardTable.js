import React, { useState, useEffect } from "react";
import { Table, Tooltip, Modal, Button, ConfigProvider, Spin } from "antd";
import { DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useRecordContext } from "../../context/RecordContext";
import { createStyles, useTheme } from "antd-style";
import { toast } from "react-toastify";

const useStyle = createStyles(({ token }) => ({
  "my-modal-body": {
    background: token.blue1,
    padding: token.paddingSM,
  },
  "my-modal-mask": {
    boxShadow: `inset 0 0 15px #fff`,
  },
  "my-modal-header": {
    borderBottom: `1px dotted ${token.colorPrimary}`,
  },
  "my-modal-footer": {
    color: token.colorPrimary,
  },
  "my-modal-content": {
    border: "1px solid #333",
  },
}));

const DashboardTable = ({
  data,
  currentPage,
  pageSize,
  setCurrentPage,
  getColumnSearchProps,
  parseTimeAgo,
  handleCopyUrl,
}) => {
  const navigate = useNavigate();
  const tokenStr = localStorage.getItem("UUID");
  const accesstoken = localStorage.getItem("AuthToken");

  const { saveRecord } = useRecordContext();
  console.log("saveRecord from context:", saveRecord);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);

  const { styles } = useStyle();
  const theme = useTheme();

  const classNames = {
    body: styles["my-modal-body"],
    mask: styles["my-modal-mask"],
    header: styles["my-modal-header"],
    footer: styles["my-modal-footer"],
    content: styles["my-modal-content"],
  };

  const modalStyles = {
    header: {
      borderLeft: "5px solid red",
      borderRadius: 0,
      paddingInlineStart: 5,
    },
    body: {
      boxShadow: "inset 0 0 5px #999",
      borderRadius: 5,
    },
    mask: {
      backdropFilter: "blur(2px)",
    },
    footer: {
      borderTop: "1px solid #333",
      paddingTop: "10px",
    },
    content: {
      boxShadow: "0 0 30px #999",
    },
  };

  // Log the raw data prop for debugging purposes
  useEffect(() => {
    console.log("Raw data prop received in DashboardTable:", data);
    setTableLoading(false);
  }, [data]);

  const showModal = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (url, mimeType) => {
    const parts = url.split("/");
    const id = parts[parts.length - 1];

    setLoading(true);
    try {
      const response = await fetch(
        "https://admin-dashboard-backend-gqqz.onrender.com/api/v1/removesession",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shortId: id, mimeType }),
        }
      );
      const result = await response.json();
      console.log("Delete result:", result);

      if (result.message === "Record deleted successfully.") {
        toast.success("Record deleted successfully!");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Error deleting record.");
    } finally {
      setLoading(false);
    }
  };

  const handleOk = () => {
    if (selectedRecord) {
      handleDelete(selectedRecord.url, selectedRecord.category);
    }
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  // Helper: Convert timeAgo string to a Date object
  const parseTimeAgoToDate = (timeAgo) => {
    const now = new Date();
    const regex = /(\d+)\s*(minute|hour|day)s?\s*ago/;
    const match = timeAgo.match(regex);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      if (unit === "minute") {
        now.setMinutes(now.getMinutes() - value);
      } else if (unit === "hour") {
        now.setHours(now.getHours() - value);
      } else if (unit === "day") {
        now.setDate(now.getDate() - value);
      }
    }
    return now;
  };

  // Helper: Check if a record has expired
  const isExpired = (createdDate, expirationDate) => {
    console.log(createdDate, expirationDate)
    const createdDateObj = new Date(createdDate);  // Date the record was created
    const expirationDateObj = new Date(expirationDate); // Expiration date from the API
    
    // Compare the expiration date to the current date
    return new Date() > expirationDateObj; // If the current date is after the expiration, it's expired
  };
  

  // Map the data without altering the fileName property
  const sortedData = Object.values(data)
    .flat()
    .map((record) => {
      console.log("Mapped record:", record); // Check if fileName exists here
      return {
        ...record,
        parsedTimeAgo: parseTimeAgoToDate(record.timeAgo),
       
      };
    })
    .sort((a, b) => b.parsedTimeAgo - a.parsedTimeAgo);

  const columns = [
    {
      title: "Id",
      dataIndex: "key",
      key: "key",
      render: (text, record, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "URLs",
      dataIndex: "url",
      key: "url",
      ...getColumnSearchProps("url"),
      render: (text, record) => {
        console.log("Record in table column:", record);
        const truncated =
          text.length > 25 ? text.substring(0, 25) + "..." : text;
        return (
          <Tooltip title="Click to copy full URL" placement="top">
            <div onClick={() => handleCopyUrl(text)} style={{ cursor: "pointer" }}>
              <span>{truncated}</span>
              <br />
              <span style={{ fontSize: "12px", color: "#888" }}>
                {record.fileName || "No file name available"}
              </span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      sorter: (a, b) => a.category.localeCompare(b.category),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Created By",
      dataIndex: "timeAgo",
      key: "timeAgo",
      align: "center",
      sorter: (a, b) => parseTimeAgo(a.timeAgo) - parseTimeAgo(b.timeAgo),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Expiration",
      dataIndex: "expiration",
      key: "expiration",
      align: "center",
      render: (expiration) => {
        const expiredStyle = expiration === "Expired" ? { color: "red" } : { color: "green" };
        return <span style={expiredStyle}>{expiration === "Expired" ? "Expired" : `${expiration} left`}</span>;
      },
    },
    
    {
      title: "Analytics View",
      key: "analytics",
      align: "center",
      render: (text, record) => (
        <Button
          style={{
            backgroundColor: "#7C5832",
            borderRadius: "20px",
            height: "30px",
            cursor: "pointer",
            border: "none",
            color: "#fff",
            padding: "0 12px",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: "300",
          }}
          onClick={() => {
            try {
              console.log("👉 Button clicked: View Analytics");
          
              // Check if the URL is valid
              if (!record.url || typeof record.url !== "string") {
                console.error("❌ Error: Invalid URL in record:", record.url);
                alert("Invalid URL. Please check the record.");
                return;
              }
          
              console.log(`✅ URL Found: ${record.url}`);
          
              // Normalize and extract the analytics ID
              let analyticsId = "";
          
              try {
                const formattedUrl = record.url.startsWith("http")
                  ? record.url
                  : `https://${record.url}`;
                const urlObj = new URL(formattedUrl);
                const pathname = urlObj.pathname; // e.g., /yrCYs
                analyticsId = pathname.replace(/^\/+/, ""); // Remove leading slash
              } catch (e) {
                console.error("❌ Error parsing URL:", e);
                alert("Invalid URL format. Unable to parse analytics ID.");
                return;
              }
          
              console.log("📊 Extracted Analytics ID:", analyticsId || "N/A");
          
              // Check if analyticsId is valid
              if (analyticsId) {
                console.log("✅ Valid Analytics ID. Proceeding to save and navigate...");
          
                // Save record
                saveRecord({
                  uuid: record.key,
                  url: record.url,
                  category: record.category,
                  userInfo: {
                    uid: tokenStr,
                    usertoken: accesstoken,
                  },
                });
          
                console.log("✅ Record saved successfully!");
                console.log(`🚀 Navigating to /dashboard/${record.category}/${analyticsId}`);
          
                // Navigate to dashboard page
                navigate(`/dashboard/${record.category}/${analyticsId}`, {
                  state: {
                    uuid: record.key,
                    token: tokenStr,
                    url: record.url,
                    category: record.category,
                  },
                });
              } else {
                console.error("❌ Error: Invalid URL format. No analytics ID found.");
                alert("Invalid URL format. Unable to extract analytics ID.");
              }
            } catch (error) {
              console.error("❌ Unexpected error occurred:", error);
              alert(`An error occurred: ${error.message}`);
            }
          }}
          
        >
          View Analytics
        </Button>
      ),
    },
    {
      title: "Delete",
      key: "delete",
      align: "center",
      render: (_, record) => (
        <DeleteOutlined
          style={{
            fontSize: "20px",
            color: "#464646",
            cursor: "pointer",
          }}
          onClick={() => showModal(record)}
        />
      ),
    },
  ];

  return (
    <>
      {tableLoading ? (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </div>
      ) : sortedData.length > 0 ? (
        <Table
          style={{ width: "56rem" }}
          dataSource={sortedData}
          columns={columns}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: sortedData.length,
            onChange: (page) => setCurrentPage(page),
          }}
        />
      ) : (
        // Instead of displaying "No records found", show loader from ANTD
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </div>
      )}
      <Modal
        title="Delete Confirmation"
        visible={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        cancelText="Cancel"
        okText="Delete"
      >
        <p>Are you sure you want to delete this record?</p>
      </Modal>
    </>
  );
  
};

export default DashboardTable;

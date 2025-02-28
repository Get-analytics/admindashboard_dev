import React, { useState } from "react";
import { Table, Tooltip, Modal, Button, ConfigProvider } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useRecordContext } from "../../context/RecordContext"; // Import the context
import { createStyles, useTheme } from "antd-style";

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
  const tokenStr = localStorage.getItem("AuthToken");
  
  // Use the context to get and set the record data
  const { saveRecord } = useRecordContext();
  console.log(saveRecord, "saved data")

  // State for controlling the modal and storing the selected record.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

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

  const showModal = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (url, mimeType) => {
    const parts = url.split("/");
    const id = parts[parts.length - 1];

    try {
      const response = await fetch("http://localhost:5000/api/v1/removesession", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortId: id, mimeType }),
      });
      const result = await response.json();
      console.log("Delete result:", result);
    } catch (error) {
      console.error("Error deleting record:", error);
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

  const columns = [
    {
      title: "Id",
      dataIndex: "key",
      key: "key",
      render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "URLs",
      dataIndex: "url",
      key: "url",
      ...getColumnSearchProps("url"),
      render: (text) => {
        const truncated = text.length > 25 ? text.substring(0, 25) + "..." : text;
        return (
          <Tooltip title="Click to copy full URL" placement="top">
            <span onClick={() => handleCopyUrl(text)} style={{ cursor: "pointer" }}>
              {truncated}
            </span>
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
      title: "Analytics View",
      key: "analytics",
      align: "center",
      render: (text, record) => (
        <Button
          style={{
            backgroundColor: "#7C5832",
            borderRadius: "15px",
            height: "25px",
            cursor: "pointer",
            border: "none",
            color: "#fff",
            padding: "0 10px",
          }}
          onClick={() => {
            // Save the record data to context when navigating
            saveRecord({
              uuid: record.key,
              token: tokenStr,
              url: record.url,
              category: record.category,
            });

            navigate("/dashboard", {
              state: {
                uuid: record.key,
                token: tokenStr,
                url: record.url,
                category: record.category,
              },
            });
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
          style={{ fontSize: "24px", color: "red", cursor: "pointer" }}
          onClick={() => showModal(record)}
        />
      ),
    },
  ];

  return (
    <>
      <Table
        dataSource={data}
        columns={columns}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: data.length,
          onChange: (page) => setCurrentPage(page),
        }}
      />
      <ConfigProvider modal={{ classNames, styles: modalStyles }}>
        <Modal
          title="Confirm Delete"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          okText="Yes"
          cancelText="No"
        >
          <p>
            Are you sure you want to delete this record? This action cannot be undone.
          </p>
        </Modal>
      </ConfigProvider>
    </>
  );
};

export default DashboardTable;

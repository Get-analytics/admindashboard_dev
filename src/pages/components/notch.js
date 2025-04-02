import React, { useState , useEffect} from "react";
import { motion } from "framer-motion";
import { Upload, Link, Filter, Settings, User, LogOut } from "lucide-react";
import { Modal, Card, Input, Progress } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { CopyOutlined, LinkOutlined } from "@ant-design/icons";
import "./notch.css";
import axios from "axios";  // Ensure axios is imported
import { toast } from "react-toastify"; // For notifications
import DateRangePicker from "./InnerComponents/Filter"; // DateRangePicker component
import { useRecordContext } from "../../context/RecordContext";

export default function Notch() {
  const auth = getAuth();
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [generatedLink, setGeneratedLink] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false); // Track if DateRangePicker should be shown
  const fileInputRef = React.useRef();
  const { closeDateFilter, setCloseDateFilter } = useRecordContext(); // Access context

  useEffect(() => {
    if (closeDateFilter) {
      setShowDateFilter(false); // Hide the date picker modal
      setCloseDateFilter(false); // Reset to false to allow re-triggering
    }
  }, [closeDateFilter, setCloseDateFilter]);
  

  // Assuming 'user' object is available from your authentication state
  const user = auth.currentUser;
  console.log(user.photoURL, "userssssssssss")
  const userInfo = { uuid: user?.uid }; // Mock user info for this example

  // Show confirmation modal for logout
  const showLogoutModal = () => {
    setIsModalVisible(true);
  };

  // Handle logout after confirmation
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("AuthToken");
      localStorage.removeItem("UUID");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Confirm logout
  const confirmLogout = () => {
    Modal.confirm({
      title: "Confirm Logout",
      icon: <ExclamationCircleOutlined />,
      content: "Are you sure you want to log out?",
      okText: "Yes, Logout",
      cancelText: "Cancel",
      onOk: handleLogout,
    });
  };

  // Show profile modal
  const showProfileModal = () => {
    setProfileModalVisible(true);
  };

  // Hide profile modal
  const hideProfileModal = () => {
    setProfileModalVisible(false);
  };

  // Show upload modal
  const showUploadModal = () => {
    setIsModalVisible(true);
  };

  // Hide upload modal
  const hideUploadModal = () => {
    setIsModalVisible(false);
  };

  const handleUrlChange = (e) => setUrl(e.target.value);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle drag enter for file upload area
  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true); // Optionally update UI to show a dragging state
  };

  const handleFileAreaClick = () => {
    if (!file) {
      handleFileUploadClick();
    }
  };

  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // Handle drag over for file upload area
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle drag leave for file upload area
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setFile(e.dataTransfer.files[0]);
  };

  // Handle URL and File Generation
  const handleGenerateLink = async (type) => {
    if (type === "url" && !url) {
      toast.warn("Please enter a URL.");
      return;
    }
    if (type === "file" && !file) {
      toast.warn("Please upload a file.");
      return;
    }

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
    let payload = new FormData();
    let headers = {};

    try {
      if (type === "url") {
        apiEndpoint = "https://admin-dashboard-backend-gqqz.onrender.com/api/v1/linkupload";
        payload = { shortId: randomId, originalUrl: url, uuid: userInfo.uuid };
        headers["Content-Type"] = "application/json";
      } else if (type === "file") {
        apiEndpoint = "https://admin-dashboard-backend-gqqz.onrender.com/api/v1/fileupload";
        payload.append("shortId", randomId);
        payload.append("file", file);
        payload.append("uuid", userInfo.uuid);
        headers = {}; // No need to set Content-Type, it's handled by FormData
      }

      const response = await axios.post(apiEndpoint, payload, {
        headers,
        onUploadProgress: (progressEvent) => {
          const percent = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent); // Update the progress bar
        },
      });

      if (response.status === 200) {
        let link = "";
        if (type === "url" && response.data.shortenedUrl) {
          link = `https://filescence-rho.vercel.app/${response.data.shortenedUrl.shortId}`;
        } else if (type === "file" && response.data.shortId) {
          link = `https://filescence-rho.vercel.app/${response.data.shortId}`;
        }
        setGeneratedLink(link); // You may want to store or display this link
        setIsModalVisible(true);
        toast.success("Upload successful! Your shortened link is ready.");
      } else {
        toast.error("Failed to upload.");
      }
    } catch (error) {
      toast.error("Error generating link: " + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setFile(null);
      setUrl("");
    }
  };

  return (
    <>
    <motion.div
      initial={{ scaleX: 0.6, scaleY: 0.6, opacity: 0, borderRadius: "50px" }}
      animate={{ scaleX: 1, scaleY: 1, opacity: 1, borderRadius: "164px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="notch-container"
    >
      {/* User avatar with icon */}
      <motion.div
        className="avatar-wrapper"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
        onClick={showProfileModal} // Open profile modal on click
      >
        <img
          src={user?.photoURL || "default-avatar.png"} // Show profile picture or default image
          alt="User Avatar"
          className="avatar"
        />
      </motion.div>

      <div className="divider-notch"></div>
      <div className="icons">
        {[Upload, Link, Filter, Settings].map((Icon, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 + index * 0.1 }}
            whileHover={{ scale: 1.1 }}
            className="icon-wrapper"
            onClick={Icon === Filter ? () => setShowDateFilter((prev) => !prev) : Icon === Upload ? showUploadModal : null}
          >
            <Icon size={22} strokeWidth={2} className="notch-icon" />
          </motion.div>
        ))}

        {/* Logout Icon */}
        <motion.div
          onClick={confirmLogout}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.6 }}
          whileHover={{ scale: 1.1 }}
          className="icon-wrapper"
        >
          <LogOut size={22} strokeWidth={2} className="notch-icon" />
        </motion.div>
      </div>


      {/* Profile Modal */}
      <Modal
        title="Profile"
        visible={profileModalVisible}
        onCancel={hideProfileModal}
        footer={null}
        width={300}
      >
        <Card bordered={false} style={{ textAlign: "center" }}>
          <img
            src={user?.photoURL || "default-avatar.png"}
            alt="User Avatar"
            style={{ width: "80px", borderRadius: "50%" }}
          />
          <h3>{user?.displayName || "No Display Name"}</h3>
          <p>{user?.email || "No Email"}</p>
        </Card>
      </Modal>

      {/* Upload Modal */}
      <Modal
        title="Upload Link and File"
        visible={isModalVisible}
        onCancel={hideUploadModal}
        footer={null}
        centered
        width={980}
        style={{ borderRadius: '30px' }}  // Add the border-radius here
      >
        <div className="linkpage-container">
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

          {/* Display Generated Link */}
          {generatedLink && (
            <div className="generated-link-container">
              <h3>Your Generated Link:</h3>
              <Input
                readOnly
                value={generatedLink}
                addonAfter={<CopyOutlined onClick={() => navigator.clipboard.writeText(generatedLink)} />}
              />
              <p className="linkpage-note">
                Copy the link and share it with your audience to track the file access.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </motion.div>
    
      {/* Show Date Filter Calendar if `showDateFilter` is true */}
      {showDateFilter && <DateRangePicker />}
    </>
  );
}

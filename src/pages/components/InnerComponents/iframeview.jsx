import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Added useNavigate to handle navigation

const IframeView = () => {
  const location = useLocation();
  const navigate = useNavigate(); // useNavigate hook to handle programmatic navigation
  const { url, markersData } = location.state || {}; // Receive the data passed via router

  console.log(url, markersData);

  const iframeRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState(0);
  const [iframeWidth, setIframeWidth] = useState(0);
  const [iframeContentHeight, setIframeContentHeight] = useState(0);
  const [iframeContentWidth, setIframeContentWidth] = useState(0);

  useEffect(() => {
    const iframeWindow = iframeRef.current?.contentWindow;
    const iframeDocument = iframeRef.current?.contentDocument;

    // Set iframe height and width on mount
    const updateIframeDimensions = () => {
      if (iframeRef.current) {
        setIframeHeight(iframeRef.current.clientHeight);
        setIframeWidth(iframeRef.current.clientWidth);
      }
    };

    const updateIframeContentDimensions = () => {
      if (iframeDocument) {
        const contentWidth = iframeDocument.documentElement.scrollWidth;
        const contentHeight = iframeDocument.documentElement.scrollHeight;
        setIframeContentWidth(contentWidth);
        setIframeContentHeight(contentHeight);
      }
    };

    // Watch for resize events of iframe container
    updateIframeDimensions(); // Initial dimension update
    updateIframeContentDimensions(); // Initial content dimension update

    // Listen for resize and scroll events
    window.addEventListener("resize", updateIframeDimensions);
    iframeWindow?.addEventListener("scroll", updateIframeContentDimensions);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", updateIframeDimensions);
      iframeWindow?.removeEventListener("scroll", updateIframeContentDimensions);
    };
  }, []);

  const createMarkers = () => {
    if (!markersData || markersData.length === 0 || iframeContentWidth === 0 || iframeContentHeight === 0) {
      return null;
    }

    return markersData.map((item, index) => {
      const [x, y] = item.position.split(",").map(Number);
      const timeSpent = item.timeSpent;

      // Calculate the marker size based on timeSpent
      const size = Math.min(timeSpent * 2, 30); // Adjust size based on time spent (e.g., max size 30px)

      // Adjust positions based on the iframe content dimensions (dynamic calculation)
      const relativeX = (x / iframeContentWidth) * iframeWidth;
      const relativeY = (y / iframeContentHeight) * iframeHeight;

      // Ensure the marker is within the bounds of the iframe
      if (relativeY < 0 || relativeY > iframeHeight || relativeX < 0 || relativeX > iframeWidth) {
        return null;
      }

      const markerStyle = {
        position: "absolute",
        left: `${relativeX}px`,
        top: `${relativeY}px`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: "rgba(255, 0, 0, 0.7)",
        borderRadius: "50%",
        zIndex: 2,
        pointerEvents: "none",
        transform: "translate(-50%, -50%)", // Center the marker at the (x, y) position
      };

      return <div key={index} style={markerStyle} />;
    });
  };

  const handleClose = () => {
    navigate("/dashboard"); // Navigate to the dashboard when the close icon is clicked
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
      {/* Close Icon */}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'transparent',
          border: 'none',
          fontSize: '24px',
          color: 'black',
          cursor: 'pointer',
          zIndex: 10
        }}
      >
        X
      </button>

      {/* Iframe Container with outline */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          border: '2px solid black',
          borderRadius: '8px',
          overflow: 'hidden', // Ensures content doesn't spill outside the container
        }}
      >
        <iframe
          ref={iframeRef}
          src={url}
          title="Heatmap"
          style={{ width: '100%', height: '100%' }}
        />
        {createMarkers()}
      </div>
    </div>
  );
};

export default IframeView;

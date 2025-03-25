import React, { useState, useEffect } from 'react';
import './HeatmapCard.css'; // Import CSS
import { useRecordContext } from '../../context/RecordContext';
import { HeatMapOutlined } from '@ant-design/icons'; // Import HeatMapOutlined icon from Ant Design

const HeatmapCard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [markersData, setMarkersData] = useState([]); // Store heatmap pointers
  const { record } = useRecordContext();
  const { uuid, token, url, category } = record || {};
  const [selectedRange, setSelectedRange] = useState('today');
  const [showIframe, setShowIframe] = useState(false); // State to toggle iframe view

  useEffect(() => {
    if (uuid && url && category) {
      const fetchSessionData = async () => {
        try {
          setLoading(true);
          setError(null);

          const updatedCategory = category === 'Web' ? 'weblink' : category;
          const apiUrl = 'https://admin-dashboard-backend-gqqz.onrender.com/api/v1/web/heatmap';
          const requestBody = {
            uuid,
            url,
            category: updatedCategory,
            ...(token && { token }),
            dateRange: selectedRange,
          };

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) throw new Error(`Error fetching session data: ${response.status}`);

          const result = await response.json();
          if (result && result.heapmappointers) {
            setSessionData(result);
            setMarkersData(result.heapmappointers); // Set heatmap pointers
          } else {
            throw new Error('No heatmap pointers available');
          }
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchSessionData();
    }
  }, [uuid, token, url, category, selectedRange]);

  const handleImageClick = () => {
    setShowIframe(true); // Show iframe in full screen when the image is clicked
  };

  const handleCloseIframe = () => {
    setShowIframe(false); // Close the iframe when the "X" is clicked
  };

  const createMarkers = () => {
    if (!markersData || markersData.length === 0) {
      return null;
    }

    return markersData.map((item, index) => {
      const [x, y] = item.position.split(',').map(Number);
      const timeSpent = item.timeSpent;

      // Calculate the marker size based on timeSpent
      const size = Math.min(timeSpent * 2, 30); // Adjust size based on time spent (e.g., max size 30px)

      const markerStyle = {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: 'rgba(255, 0, 0, 0.7)',
        borderRadius: '50%',
        zIndex: 2,
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)', // Center the marker at the (x, y) position
      };

      return <div key={index} style={markerStyle} />;
    });
  };

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <div className="heatmap-icon">
          <HeatMapOutlined style={{ fontSize: '24px', color: '#6C4E2A' }} /> {/* AntD HeatMap Icon */}
        </div>
        <div className="sub-heading">
          <p className="card-heading">Heat Map</p>
          <p className="click-count">
            {loading
              ? 'Loading...'
              : sessionData && sessionData.heapmappointers
              ? `${sessionData.heapmappointers.length} clicks`
              : 'No data available'}
          </p>
        </div>
      </div>

      {/* Display the image, and when clicked, show the full-screen iframe */}
      {!showIframe && !loading && !sessionData && (
        <div className="heatmap-image-container">
         
        </div>
      )}

      {loading && <p>Loading heatmap...</p>}
      {!showIframe && !loading && (
        <img
          src="https://cdn.prod.website-files.com/66956975b340994e74d12738/67b39d5819ba175ce7dd1a43_how-to-read-a-website-heatmap-properly.webp" // Placeholder image for testing
          alt="Heatmap"
          className="heatmap-image"
          onClick={handleImageClick}
          style={{ cursor: 'pointer' }} // Ensure the cursor changes on hover
        />
      )}

      {/* Full-screen iframe container when the image is clicked */}
      {showIframe && sessionData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'white',
            zIndex: 9999, // Ensure the iframe is on top
            border: '2px solid black',
          }}
        >
          {/* Close Button */}
          <div
            onClick={handleCloseIframe}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              padding: '10px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '20px',
              zIndex: 10000, // Make sure it is on top of the iframe
            }}
          >
            X
          </div>

          <iframe
            src={sessionData.sourceurl}
            title="Heatmap"
            style={{
              width: '100vw',
              height: '100vh',
              border: 'none', // Remove border of iframe
            }}
          />
          {createMarkers()}
        </div>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default HeatmapCard;

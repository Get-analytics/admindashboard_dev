import React, { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { Modal } from "antd";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { Eye } from "lucide-react";
import { useRecordContext } from "../../context/RecordContext";
import "./map.css";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Helper function for color scaling
const colorScale = (value) => {
  if (value > 4000) return "#B79F85";
  if (value > 3000) return "#7C5832";
  if (value > 2000) return "#7C5832";
  return "#B79F85";
};

export default function TrafficSource() {
  // view can be "map" or "list"
  const [view, setView] = useState("map");
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [sessionData, setSessionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { record } = useRecordContext();
  const { uuid, token, url, category } = record || {};

  console.log(uuid, token, url, category , 'map based category')

  // Fetch dynamic data for session (list and marker data)
  useEffect(() => {
    if (uuid && url && category) {
      const fetchSessionData = async () => {
        try {
          setLoading(true);
          setError(null);

          const updatedCategory = category === "Web" ? "weblink" : category;
          const apiEndpoints = {
            Pdf: "http://localhost:5000/api/v1/pdf/traffic",
            weblink: "http://localhost:5000/api/v1/web/traffic",
            Video: "http://localhost:5000/api/v1/video/traffic",
            Docx: "http://localhost:5000/api/v1/docx/traffic",
          };

          const apiUrl = apiEndpoints[updatedCategory];
          if (!apiUrl) throw new Error("Invalid category");

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
          console.log("Session Data Received:", result);

          if (result.success && Array.isArray(result.data.listViewData)) {
            setSessionData(result.data.listViewData);
          } else {
            throw new Error("No session data available");
          }
        } catch (error) {
          console.error(error.message);
          setError(error.message);
          setSessionData([]); // Ensures no crash even on failure
        } finally {
          setLoading(false);
        }
      };

      fetchSessionData();
    }
  }, [uuid, token, url, category]);

  console.log(selectedMarker, "selected marker");

  // Map the fetched session data to markers and ensure districts and states are arrays
  const markers = sessionData.map((item) => ({
    name: item.country,
    coordinates: item.coordinates || [0, 0],
    districts: item.districts ? item.districts.split(", ") : [], // Split districts into array
    states: item.states ? item.states.split(", ") : [] // Split states into array
  }));

  return (
    <div className="traffic-card">
      <div className="traffic-header">
        <h3>Traffic Source</h3>
        <div className="view-options">
          <span
            className={view === "map" ? "active-view" : "inactive-view"}
            onClick={() => setView("map")}
          >
            Map View
          </span>{" "}
          |{" "}
          <span
            className={view === "list" ? "active-view" : "inactive-view"}
            onClick={() => setView("list")}
          >
            List View
          </span>{" "}
          |{" "}
          <span className="inactive-view">Traffic Medium</span>
        </div>
      </div>

      <div className="traffic-content">
        {view === "map" ? (
          <div className="traffic-map">
            <ComposableMap
              projection="geoEqualEarth"
              projectionConfig={{ scale: 120, center: [0, 10] }}
              width={550}
              height={400}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryName = geo.properties.NAME;
                    const value = sessionData.find((data) => data.country === countryName)?.views || 0;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={colorScale(value)}
                        stroke="#FFF"
                        style={{
                          default: { outline: "2px" },
                          hover: { fill: "#7C5832", outline: "none" },
                          pressed: { outline: "2px" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
              {markers.map((marker, i) => {
                const isHovered = hoveredMarker === i;
                return (
                  <Marker
                    key={i}
                    coordinates={marker.coordinates}
                    onMouseEnter={() => setHoveredMarker(i)}
                    onMouseLeave={() => setHoveredMarker(null)}
                    onClick={() => setSelectedMarker(marker)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      r={isHovered ? 10 : 5}
                      fill={isHovered ? "#FF4500" : "#F00"}
                      stroke="#fff"
                      strokeWidth={isHovered ? 3 : 2}
                    />
                    <text
                      textAnchor="middle"
                      y={isHovered ? marker.markerOffset - 5 : marker.markerOffset}
                      style={{
                        fontFamily: "system-ui",
                        fill: isHovered ? "#000" : "#5D5A6D",
                        fontSize: isHovered ? "14px" : "16px",
                        fontWeight: "bold",
                      }}
                    >
                      {marker.name}
                    </text>
                  </Marker>
                );
              })}
            </ComposableMap>
          </div>
        ) : (
          <div className="traffic-list">
            <table>
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Daily Avg</th>
                  <th>Views</th>
                </tr>
              </thead>
              <tbody>
                {sessionData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.country}</td>
                    <td>
                      {item.dailyAvg}{" "}
                      {item.change === "up" ? (
                        <FaArrowUp className="icon up" />
                      ) : (
                        <FaArrowDown className="icon down" />
                      )}
                      <div className="progress-bar">
                        <div
                          className={`progress ${item.change}`}
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    </td>
                    <td>
                      {item.views} <Eye className="icon eye" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedMarker && (
        <Modal
          visible={true}
          title={selectedMarker.name}
          onCancel={() => setSelectedMarker(null)}
          footer={null}
          centered
        >
          {selectedMarker.states.length > 0 && (
            <div>
              <p style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>States:</p>
              <ul style={{ fontSize: "16px", paddingLeft: "20px" }}>
                {selectedMarker.states.map((state, index) => (
                  <li key={index}>{state}</li>
                ))}
              </ul>
            </div>
          )}
          {selectedMarker.districts.length > 0 ? (
            <div>
              <p style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Districts:</p>
              <ul style={{ fontSize: "16px", paddingLeft: "20px" }}>
                {selectedMarker.districts.map((district, index) => (
                  <li key={index}>{district}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No district data available.</p>
          )}
        </Modal>
      )}
    </div>
  );
}

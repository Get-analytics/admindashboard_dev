import React, { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { Eye } from "lucide-react";
import { useRecordContext } from "../../context/RecordContext";
import { Modal, Table } from "antd";
import "./map.css";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const colorScale = (value) => {
  if (value > 4000) return "#B79F85";
  if (value > 3000) return "#7C5832";
  if (value > 2000) return "#7C5832";
  return "#B79F85";
};

export default function TrafficSource() {
  const [view, setView] = useState("map");
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [sessionData, setSessionData] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { record } = useRecordContext();
  const { uuid, token, url, category } = record || {};

  const [countryNameCache, setCountryNameCache] = useState({});

  useEffect(() => {
    if (uuid && url && category) {
      const fetchSessionData = async () => {
        try {
          setLoading(true);
          setError(null);

          const updatedCategory = category === "Web" ? "weblink" : category;
          const apiEndpoints = {
            pdf: "https://admin-dashboard-backend-rust.vercel.app/api/v1/pdf/traffic",
            web: "https://admin-dashboard-backend-rust.vercel.app/api/v1/web/traffic",
            video: "https://admin-dashboard-backend-rust.vercel.app/api/v1/video/traffic",
            docx: "https://admin-dashboard-backend-rust.vercel.app/api/v1/docx/traffic",
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
        } catch (err) {
          console.error(err.message);
          setError(err.message);
          setSessionData([]);
        } finally {
          setLoading(false);
        }
      };

      fetchSessionData();
    }
  }, [uuid, token, url, category]);

  useEffect(() => {
    async function fetchCountryName(countryCode) {
      if (countryNameCache[countryCode]) {
        return countryNameCache[countryCode];
      }
      try {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode.toLowerCase()}`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && data[0].name) {
          const countryName = data[0].name.common;
          setCountryNameCache((prevCache) => ({
            ...prevCache,
            [countryCode]: countryName,
          }));
          return countryName;
        }
      } catch (error) {
        console.error("Error fetching country name for", countryCode, error);
      }
      return countryCode;
    }

    async function fetchCountryCenter(countryCode) {
      try {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode.toLowerCase()}`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && data[0].latlng) {
          const [lat, lng] = data[0].latlng;
          return [lng, lat];
        }
      } catch (error) {
        console.error("Error fetching country center for", countryCode, error);
      }
      return null;
    }

    async function processMarkers() {
      const newMarkers = await Promise.all(
        sessionData.map(async (item) => {
          const countryCode = item.country;
          const dynamicCoords = await fetchCountryCenter(countryCode);
          let coords = dynamicCoords || [0, 0];
          const countryName = await fetchCountryName(countryCode);

          return {
            name: countryName,
            coordinates: coords,
            districts: item.districts ? item.districts.split(",").map(d => d.trim()) : [],
            states: item.states ? item.states.split(",").map(s => s.trim()) : [],
            countryCode,
          };
        })
      );
      setMarkers(newMarkers);
    }

    if (sessionData.length > 0) {
      processMarkers();
    }
  }, [sessionData, countryNameCache]);

  const columns = [
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
    },
    {
      title: "District",
      dataIndex: "district",
      key: "district",
    },
  ];

  const dataSource = selectedMarker
    ? selectedMarker.districts.map((district, index) => ({
        key: index,
        country: selectedMarker.name || "Unknown",
        state: selectedMarker.states.length > 0 ? selectedMarker.states[0] : "Unknown",
        district: district || "No District Data",
      }))
    : [];

  return (
    <div className="traffic-card">
      <div className="traffic-header">
        <h3>Traffic Source</h3>
        <div className="view-options">
          <span className={view === "map" ? "active-view" : "inactive-view"} onClick={() => setView("map")}>
            Map View
          </span>{" "}
          |{" "}
          <span className={view === "list" ? "active-view" : "inactive-view"} onClick={() => setView("list")}>
            List View
          </span>
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
                          default: { outline: "none" },
                          hover: { fill: "#7C5832", outline: "none" },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
              {markers.map((marker, i) => (
                <Marker
                  key={i}
                  coordinates={marker.coordinates}
                  onMouseEnter={() => setHoveredMarker(i)}
                  onMouseLeave={() => setHoveredMarker(null)}
                  onClick={() => setSelectedMarker(marker)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    r={hoveredMarker === i ? 10 : 5}
                    fill={hoveredMarker === i ? "#FF4500" : "#F00"}
                    stroke="#fff"
                    strokeWidth={hoveredMarker === i ? 3 : 2}
                  />
                  <text
                    textAnchor="middle"
                    y={-15}
                    style={{
                      fontFamily: "system-ui",
                      fill: hoveredMarker === i ? "#000" : "#5D5A6D",
                      fontSize: hoveredMarker === i ? "14px" : "16px",
                      fontWeight: "bold",
                    }}
                  >
                    {marker.name}
                  </text>
                </Marker>
              ))}
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
                {sessionData.map((item, index) => {
                  const dailyAvgNum = parseFloat(item.dailyAvg.replace("%", "")) || 0;
                  const ProgressrateBar = dailyAvgNum * 10;
                  return (
                    <tr key={index}>
                      <td>{item.country}</td>
                      <td>
                        {item.dailyAvg}{" "}
                        {item.change === "up" && <FaArrowUp className="icon up" />}
                        {item.change === "down" && <FaArrowDown className="icon down" />}
                        <div className="progress-bar">
                          <div
                            className={`progress ${item.change}`}
                            style={{ width: `${ProgressrateBar}%` }}
                          ></div>
                        </div>
                      </td>
                      <td>
                        {item.views} <Eye className="icon eye" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedMarker && (
        <Modal
          open={true}
          onCancel={() => setSelectedMarker(null)}
          footer={null}
          centered
        >
          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            size="small"
            rowKey="key"
          />
        </Modal>
      )}
    </div>
  );
}

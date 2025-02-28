import React, { useEffect, useState, useRef } from "react";
import {
  Player,
  ControlBar,
  BigPlayButton,
  ReplayControl,
  ForwardControl,
  VolumeMenuButton,
  CurrentTimeDisplay,
  DurationDisplay,
  TimeDivider,
  PlaybackRateMenuButton
} from "video-react";
import "video-react/dist/video-react.css";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useRecordContext } from "../../context/RecordContext";

const VideoWithAdvancedFeatures = () => {
  const [analyticsData, setAnalyticsData] = useState(null); // State to hold the response data
  const [loading, setLoading] = useState(true); // Loading state to show a loader until data is fetched

  const playerRef = useRef(null);
  const playbackRate = 1;

  const { record } = useRecordContext();
  const { uuid, token, url, category } = record || {};
  console.log(uuid, token, url, category, "datafrom mostviewed");

  // Fetch data when component mounts
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        if (!uuid || !token || !url || !category) return;

        // API endpoint
        const endpoint = "http://localhost:5000/api/v1/video/viewanalytics";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uuid, token, url, category }),
        });

        const data = await response.json();
        setAnalyticsData(data); // Set the response data to state
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false); // Set loading to false once data is fetched
      }
    };

    fetchAnalyticsData();
  }, [uuid, token, url, category]);

  // Transform API data to the format for the graph
  const transformAnalyticsData = () => {
    if (!analyticsData) return [];

    return analyticsData.videoAnalytics.map((item) => {
      const [start, end] = item.durationRange.split(" to ").map(Number);
      return {
        durationRange: item.durationRange, // Keep the exact duration range as a label
        duration: (start + end) / 2, // Use the midpoint of the range for the x-axis
        views: item.views,
      };
    }).sort((a, b) => a.views - b.views); // Sort by views (least to most)
  };

  // If still loading, show a loader
  if (loading) {
    return <div>Loading...</div>;
  }

  const viewershipData = transformAnalyticsData();

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "900px", margin: "auto", maxHeight: '1000px' }}>
      <div style={{ position: "relative" }}>
        {/* Video Player with built-in ControlBar */}
        <Player
          ref={playerRef}
          onLoadedMetadata={() => {
            const duration = playerRef.current.getState().player.duration;
            console.log(`Total video duration: ${duration} seconds`);
          }}
          src={analyticsData.Videosourceurl || "https://media.w3.org/2010/05/sintel/trailer_hd.mp4"} // Dynamically set the video URL
          playbackRate={playbackRate}
          style={{ width: '100%', height: '700px' }} // Set height to 700px for the player
        >
          <BigPlayButton position="center" />
          {/* Built-in controls with additional tool buttons */}
          <ControlBar autoHide={false}>
            <ReplayControl seconds={10} order={1.1} />
            <ForwardControl seconds={10} order={1.2} />
            <VolumeMenuButton vertical />
            <CurrentTimeDisplay order={4.1} />
            <TimeDivider order={4.2} />
            <DurationDisplay order={4.3} />
            <PlaybackRateMenuButton rates={[0.5, 1, 1.5, 2]} order={7.1} />
          </ControlBar>
        </Player>

        {/* Overlay: Dynamic viewership graph */}
        <div
          style={{
            position: "absolute",
            left: "0",
            width: "100%",
            height: "150px", // Increased height to ensure the graph has space
            background: "rgba(0, 0, 0, 0.6)",
            padding: "5px",
            borderRadius: "10px"
          }}
        >
          {/* Graph area */}
          <div style={{ height: "70%", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewershipData}>
                <XAxis dataKey="duration" tick={{ fill: "white", fontSize: 12 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: "#333", border: "none" }} />
                {/* Line chart with dynamic data */}
                <Line
                  type="monotone" // Smooth curve type (you can change it to "step" for a zigzag)
                  dataKey="views"
                  stroke="gray"
                  strokeWidth={2}
                  dot={{ fill: "white", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Label area: Display the range dynamically */}
          <div
            style={{
              height: "30%",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              paddingTop: "2px"
            }}
          >
            {viewershipData.map((data, idx) => (
              <span key={idx} style={{ color: "white", fontSize: "12px" }}>
                {data.durationRange}, {data.views} views
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoWithAdvancedFeatures;

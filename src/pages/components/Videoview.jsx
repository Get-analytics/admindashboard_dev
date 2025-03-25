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
  PlaybackRateMenuButton,
  ProgressControl,
} from "video-react";
import "video-react/dist/video-react.css";

import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

import { useRecordContext } from "../../context/RecordContext";

const formatSeconds = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const dataPoint = payload[0].payload;
  const watchedPercent =
    dataPoint.watched != null ? `${dataPoint.watched}% watched` : "N/A";

  return (
    <div
      style={{
        background: "rgba(0, 0, 0, 0.8)",
        padding: "8px 12px",
        borderRadius: "5px",
        color: "#fff",
        fontSize: "14px",
      }}
    >
      <div>
        <strong>Time:</strong> {formatSeconds(dataPoint.time)}
      </div>
      <div>
        <strong>Views:</strong> {dataPoint.views.toLocaleString()}
      </div>
      <div>
        {/* <strong>Watched:</strong> {watchedPercent} */}
      </div>
    </div>
  );
};

const VimeoLikeRetention = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const playerRef = useRef(null);

  const { record } = useRecordContext();
  const { uuid, token, url, category } = record || {};

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        if (!uuid || !token || !url || !category) return;

        const endpoint =
          "https://admin-dashboard-backend-gqqz.onrender.com/api/v1/video/viewanalytics";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid, token, url, category }),
        });

        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [uuid, token, url, category]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleStateChange = () => {
      const playerState = player.getState().player;
      setCurrentTime(playerState.currentTime);
      if (playerState.duration && playerState.duration !== videoDuration) {
        setVideoDuration(playerState.duration);
      }
    };

    player.subscribeToStateChange(handleStateChange);

    return () => {
      // Cleanup if needed
    };
  }, [videoDuration]);

  // Transform analytics data and ensure boundaries at 0 and videoDuration
  const transformAnalyticsData = () => {
    let expandedData = [];
    if (analyticsData && analyticsData.videoAnalytics) {
      analyticsData.videoAnalytics.forEach((item) => {
        const [start, end] = item.durationRange.split(" to ").map(Number);
        const watched = item.watched != null ? item.watched : null;
        expandedData.push({ time: start, views: item.views, watched });
        expandedData.push({ time: end, views: item.views, watched });
      });
      expandedData.sort((a, b) => a.time - b.time);
    }
    // Ensure chart covers full video duration
    if (videoDuration > 0) {
      if (expandedData.length === 0 || expandedData[0].time > 0) {
        expandedData.unshift({ time: 0, views: 0, watched: 0 });
      }
      if (
        expandedData.length === 0 ||
        expandedData[expandedData.length - 1].time < videoDuration
      ) {
        expandedData.push({ time: videoDuration, views: 0, watched: 0 });
      }
    }
    return expandedData;
  };

  const { chartData, totalDuration } = React.useMemo(() => {
    const data = transformAnalyticsData();
    // Use the video duration as the upper bound (or fallback to max data point)
    const maxTime =
      videoDuration || (data.length > 0 ? Math.max(...data.map((d) => d.time)) : 0);
    return {
      chartData: data,
      totalDuration: maxTime,
    };
  }, [analyticsData, videoDuration]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        margin: "0 auto",
        width: "100%",
        maxWidth: "900px",
      }}
    >
      <h2>Video Analytics</h2>

      <div
        style={{ position: "relative", background: "#000" }}
        onMouseEnter={() => setShowAnalytics(true)}
        onMouseLeave={() => setShowAnalytics(false)}
      >
        <Player
          ref={playerRef}
          src={
            analyticsData?.Videosourceurl ||
            "https://media.w3.org/2010/05/sintel/trailer_hd.mp4"
          }
          style={{ width: "100%", maxHeight: "600px" }}
        >
          <BigPlayButton position="center" />
          <ControlBar autoHide={false}>
            <ReplayControl seconds={10} order={1.1} />
            <ForwardControl seconds={10} order={1.2} />
            <VolumeMenuButton vertical />
            <CurrentTimeDisplay order={4.1} />
            <TimeDivider order={4.2} />
            <DurationDisplay order={4.3} />
            <PlaybackRateMenuButton rates={[0.5, 1, 1.5, 2]} order={7.1} />
            <ProgressControl />
          </ControlBar>
        </Player>

        {showAnalytics && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: "10px",
              top: "10px",
              height: "250px",
              background: "rgba(0, 0, 0, 0.6)",
              padding: "10px",
              boxSizing: "border-box",
              backdropFilter: "blur(4px)",
              borderRadius: "4px",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#999"
                  opacity={0.2}
                  vertical={false}
                />

                <defs>
                  <linearGradient id="vimeoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C5832" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0.1} />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="time"
                  type="number"
                  domain={[0, totalDuration]}
                  tickFormatter={(tick) => formatSeconds(tick)}
                  tick={{ fill: "#fff", fontSize: 12 }}
                  axisLine={{ stroke: "#999" }}
                  tickLine={false}
                />
                <YAxis
                  hide
                  // Extra space at the top so peaks stand out
                  domain={["dataMin - 5", "dataMax + 20"]}
                />

                <ReferenceLine
                  x={currentTime}
                  stroke="#fff"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />

                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="natural" // More curved than monotoneX
                  dataKey="views"
                  stroke="#7C5832"
                  strokeWidth={2}
                  fill="url(#vimeoGradient)"
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  dot={{ r: 3, strokeWidth: 1, stroke: "#7C5832", fill: "#fff" }}
                  activeDot={{ r: 5, stroke: "#7C5832", strokeWidth: 2, fill: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default VimeoLikeRetention;
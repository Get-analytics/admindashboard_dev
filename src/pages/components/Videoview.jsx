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

// Helper to format seconds as mm:ss
const formatSeconds = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const dataPoint = payload[0].payload;
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

  // Extract context record with your custom structure
  // Expected record structure:
  // {
  //   "uuid": "video-4-https://view.sendnow.live/mJoBU",
  //   "url": "https://view.sendnow.live/mJoBU",
  //   "category": "video",
  //   "userInfo": {
  //      "uid": "XWLEbJxLH6dlXvASX4LtVXZjH0n1",
  //      "usertoken": "..."
  //   }
  // }
  const { record } = useRecordContext();
  console.log("Record context:", record);
  const { url, category, userInfo } = record || {};
  // Derive uuid from userInfo.uid and token from userInfo.usertoken
  const uuid = userInfo ? userInfo.uid : "";
  const token = userInfo ? userInfo.usertoken : "";
  console.log("Derived values:", { uuid, token, url, category });

  // Use a fallback video URL in case the record context url is missing or incomplete.
  const videoSrcFallback =
    "https://storage.googleapis.com/testridy-6db7c.appspot.com/videos/SampleVideo_1280x720_30mb (2).mp4";
  const videoSrc = url || videoSrcFallback;
  console.log("Video source set to:", videoSrc);

  // Fetch analytics data from backend.
  useEffect(() => {
    console.log(url, category, userInfo, "infooooooooo")
    const fetchAnalyticsData = async () => {
      try {
        console.log("Attempting API call with:", { uuid, token, videoSrc, category });
        if (!uuid || !token || !videoSrc || !category) {
          console.error("Missing required record values:", { uuid, token, videoSrc, category });
          return;
        }
        const endpoint = "http://localhost:5000/api/v1/video/viewanalytics";
        console.log("Sending POST to:", endpoint);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid, token, url: videoSrc, category }),
        });
        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Analytics data fetched:", data);
        setAnalyticsData(data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
  }, [uuid, token, videoSrc, category]);

  // Subscribe to player state changes.
  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      console.warn("Player reference not set yet.");
      return;
    }
    const handleStateChange = () => {
      const playerState = player.getState().player;
      setCurrentTime(playerState.currentTime);
      if (playerState.duration && playerState.duration !== videoDuration) {
        setVideoDuration(playerState.duration);
      }
    };
    player.subscribeToStateChange(handleStateChange);
  }, [videoDuration]);

  // When video metadata loads, set video duration.
  const handleLoadedMetadata = () => {
    if (playerRef.current) {
      const duration = playerRef.current.getState().player.duration;
      console.log("Loaded metadata, video duration:", duration);
      setVideoDuration(duration);
    }
  };

  // Transform analyticsData.videoAnalytics into chart-friendly data.
  // Adjust this if your API returns duration analytics under a different key.
  const transformAnalyticsData = () => {
    let expandedData = [];
    if (analyticsData && analyticsData.videoAnalytics && analyticsData.videoAnalytics.length > 0) {
      analyticsData.videoAnalytics.forEach((item) => {
        console.log("Processing item:", item);
        // Expected format: "start to end"
        const [start, end] = item.durationRange.split(" to ").map(Number);
        expandedData.push({ time: start, views: item.views });
        expandedData.push({ time: end, views: item.views });
      });
      expandedData.sort((a, b) => a.time - b.time);
    }
    // Ensure a starting point at 0.
    if (expandedData.length > 0 && expandedData[0].time > 0) {
      expandedData.unshift({ time: 0, views: 0 });
    } else if (expandedData.length === 0 && videoDuration > 0) {
      expandedData = [{ time: 0, views: 0 }, { time: videoDuration, views: 0 }];
    }
    console.log("Transformed chart data:", expandedData);
    return expandedData;
  };

  const { chartData, totalDuration } = React.useMemo(() => {
    const data = transformAnalyticsData();
    const maxTime = data.length > 0 ? Math.max(...data.map((d) => d.time)) : videoDuration;
    console.log("Chart domain max time:", maxTime);
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
    <div style={{ fontFamily: "Arial, sans-serif", margin: "0 auto", width: "100%", maxWidth: "900px" }}>
      <h2>Video Analytics</h2>
      <div
        style={{ position: "relative", background: "#000" }}
        onMouseEnter={() => setShowAnalytics(true)}
        onMouseLeave={() => setShowAnalytics(false)}
      >
        <Player
          ref={playerRef}
          src={analyticsData && analyticsData.Videosourceurl ? analyticsData.Videosourceurl : videoSrc}
          onLoadedMetadata={handleLoadedMetadata}
          style={{ width: "100%", maxHeight: "600px" }}
          autoPlay
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
              <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#999" opacity={0.2} vertical={false} />
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
                <YAxis hide domain={["dataMin - 5", "dataMax + 20"]} />
                <ReferenceLine
                  x={currentTime}
                  stroke="#fff"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="natural"
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

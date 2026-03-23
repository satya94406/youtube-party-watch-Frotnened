import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { connectSocket, sendMessage } from "../services/socket";
import InviteModal from "../components/InviteModal";
import YouTube from "react-youtube";

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const { userId, username } = location.state || {};

  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  const suggestedVideos = [
    { title: "Pehle Kabhi Na Mera Haal", videoId: "OtKa_eN88Qo" },
    { title: "Lofi Chill Beats", videoId: "jfKfPfyJRdk" },
    { title: "Jiya Re", videoId: "smn3mDBOUy4" },
    { title: "Desh Rangila", videoId: "drlfr5Rtb1o" },
    { title: "Coding Music Mix", videoId: "7NOSDKb0HlU" }
  ];

  const [videoId, setVideoId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [participants, setParticipants] = useState({});
  const [inviteOpen, setInviteOpen] = useState(false);
  const [role, setRole] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [seekTo, setSeekTo] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [apiResults, setApiResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);

  const playerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!roomId || !userId) return;

    connectSocket(
      roomId,
      (data) => {
        if (data.videoId) setVideoId(data.videoId);
        if (data.isPlaying !== undefined) setIsPlaying(data.isPlaying);
        if (data.currentTime !== undefined) setSeekTo(data.currentTime);

        if (data.participants) {
          setParticipants(data.participants);
          setRole(data.participants[userId]?.role || "");
        }

        if (data.chatMessages) {
          setMessages(data.chatMessages);
        }
      },
      userId,
      username
    );
  }, [roomId, userId, username]);

  const searchYouTube = async (query) => {
    if (!query) return;

    try {
      setLoading(true);

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${API_KEY}&type=video&maxResults=6`
      );

      const data = await res.json();

      const videos = data.items.map((item) => ({
        title: item.snippet.title,
        videoId: item.id.videoId,
        thumbnail: item.snippet.thumbnails.medium.url,
      }));

      setApiResults(videos);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (videoUrl.length > 2) {
        searchYouTube(videoUrl);
      } else {
        setApiResults([]);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [videoUrl]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const extractVideoId = (url) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.searchParams.get("v")) return parsedUrl.searchParams.get("v");
      if (parsedUrl.hostname === "youtu.be") return parsedUrl.pathname.slice(1);
      if (parsedUrl.pathname.includes("/shorts/")) return parsedUrl.pathname.split("/shorts/")[1];
      return null;
    } catch {
      return null;
    }
  };

  const handleSetVideo = () => {
    const id = extractVideoId(videoUrl);
    if (!id) return alert("Invalid URL");

    sendMessage("/app/changeVideo", { roomId, videoId: id });
    setVideoUrl("");
    setShowSuggestions(false);
  };

  const handleSuggestedClick = (video) => {
    sendMessage("/app/changeVideo", { roomId, videoId: video.videoId });
    setShowSuggestions(false);
    setVideoUrl("");
  };

  const localFiltered = suggestedVideos.filter((v) =>
    v.title.toLowerCase().includes(videoUrl.toLowerCase())
  );

  const finalSuggestions =
    apiResults.length > 0 ? apiResults : localFiltered;

  useEffect(() => {
    if (!playerRef.current) return;

    try {
      playerRef.current.seekTo(seekTo, true);
      isPlaying ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
    } catch (e){
      console.log(e);
    }
  }, [isPlaying, seekTo]);

  const onPlay = () => role === "Admin" && sendMessage("/app/playPause", { roomId, isPlaying: true });
  const onPause = () => role === "Admin" && sendMessage("/app/playPause", { roomId, isPlaying: false });

  const onStateChange = (e) => {
    if (role !== "Admin") return;
    sendMessage("/app/seek", { roomId, currentTime: e.target.getCurrentTime() });
  };

  const handleSendMessage = () => {
    if (!chatInput) return;
    sendMessage("/app/chat", { roomId, userId, username, message: chatInput });
    setChatInput("");
  };

  return (
  <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row">

    <div className="flex-1 p-4 md:p-6">

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold tracking-wide">
          🎬 Room: <span className="text-blue-400">{roomId}</span>
        </h2>

        <button
          onClick={() => setInviteOpen(true)}
          className="bg-green-500 hover:bg-green-600 transition px-4 py-2 rounded-lg text-sm"
        >
          ➕ Invite
        </button>
      </div>

      <div ref={inputRef} className="relative flex gap-2 mb-4">

        <div className="relative flex-1">
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search or paste YouTube URL..."
            className="w-full p-3 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />

          {videoUrl && (
            <button
              onClick={() => setVideoUrl("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ✖
            </button>
          )}
        </div>

        <button
          onClick={handleSetVideo}
          className="bg-blue-500 hover:bg-blue-600 px-5 rounded-lg transition"
        >
          Play
        </button>

        {showSuggestions && (
          <div className="absolute top-14 left-0 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
            {loading && <div className="p-4 text-center text-gray-400">Loading...</div>}

            {!loading && finalSuggestions.map((video) => (
              <div
                key={video.videoId}
                onClick={() => handleSuggestedClick(video)}
                className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer transition"
              >
                {video.thumbnail && (
                  <img
                    src={video.thumbnail}
                    alt=""
                    className="w-24 h-14 object-cover rounded-md"
                  />
                )}

                <p className="text-sm line-clamp-2">{video.title}</p>
              </div>
            ))}

            {!loading && finalSuggestions.length === 0 && (
              <div className="p-4 text-center text-gray-400">No results</div>
            )}
          </div>
        )}
      </div>

      {videoId ? (
 <div className="w-full h-[70vh] bg-black rounded-xl overflow-hidden">
  <YouTube
    videoId={videoId}
    opts={{
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 1,
        controls: 1,
      },
    }}
    onReady={(e) => (playerRef.current = e.target)}
    onPlay={onPlay}
    onPause={onPause}
    onStateChange={onStateChange}
    className="w-full h-full"
  />
</div>

      ) : (
        <div className="flex items-center justify-center h-[400px] bg-gray-800 rounded-xl text-gray-400">
          🎬 No video playing
        </div>
      )}
    </div>

    <div className="w-full md:w-80 bg-gray-800 flex flex-col border-t md:border-t-0 md:border-l border-gray-700">

      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold mb-3">👥 Participants</h3>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {Object.values(participants).map((p) => (
            <div
              key={p.userId}
              className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded-lg text-sm"
            >
              <span className="truncate">{p.username}</span>
              <span className="text-yellow-400 text-xs">{p.role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4">

        <h3 className="text-lg font-semibold mb-2">💬 Chat</h3>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">

          {messages.map((msg, idx) => {
            const isMe = msg.userId === userId;

            return (
              <div
                key={idx}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                    isMe
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-200"
                  }`}
                >
                  {!isMe && (
                    <div className="text-xs text-yellow-300 mb-1">
                      {msg.username}
                    </div>
                  )}
                  {msg.message}
                </div>
              </div>
            );
          })}

          <div ref={chatEndRef} />
        </div>

        <div className="flex gap-2 mt-3">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />

          <button
            onClick={handleSendMessage}
            className="bg-blue-500 hover:bg-blue-600 px-4 rounded-lg"
          >
            Send
          </button>
        </div>
      </div>
    </div>

    {inviteOpen && (
      <InviteModal
        closeInviteModal={() => setInviteOpen(false)}
        roomId={roomId}
      />
    )}
  </div>
);
}

export default Room;
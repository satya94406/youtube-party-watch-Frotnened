import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import Player from "../components/Player";
import { connectSocket, sendMessage } from "../services/socket";
import InviteModal from "../components/InviteModal";

function Room() {
  const { roomId } = useParams();
  const location = useLocation();

  const [userId, setUserId] = useState(null);
  const [videoId, setVideoId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [participants, setParticipants] = useState({});
  const [inviteOpen, setInviteOpen] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [seekTo, setSeekTo] = useState(null);
  const [role, setRole] = useState("");

  const extractVideoId = (url) => {
    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.searchParams.get("v")) {
        return parsedUrl.searchParams.get("v");
      }

      if (parsedUrl.hostname === "youtu.be") {
        return parsedUrl.pathname.slice(1);
      }

      if (parsedUrl.pathname.includes("/embed/")) {
        return parsedUrl.pathname.split("/embed/")[1];
      }

      if (parsedUrl.pathname.includes("/shorts/")) {
        return parsedUrl.pathname.split("/shorts/")[1];
      }

      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const joinRoom = async () => {
      if (!location.state) {
        const username = prompt("Enter your name");

        const res = await fetch(
          `http://localhost:8084/api/join?roomId=${roomId}&username=${username}`,
          { method: "POST" }
        );

        const data = await res.json();

        const user = Object.values(data.participants).find(
          (p) => p.username === username
        );

        setUserId(user.userId);
      } else {
        setUserId(location.state.userId);
      }
    };

    joinRoom();
  }, []);

  useEffect(() => {
    if (!roomId || !userId) return;

    connectSocket(roomId, (data) => {
      if (data.videoId) setVideoId(data.videoId);
      if (data.isPlaying !== undefined) setIsPlaying(data.isPlaying);
      if (data.currentTime !== undefined) setSeekTo(data.currentTime);

      if (data.participants) {
        setParticipants(data.participants);
        setRole(data.participants[userId]?.role);
      }
    });
  }, [roomId, userId]);

  const handleSetVideo = () => {
    if (role !== "HOST" && role !== "MODERATOR") {
      alert("Only Host/Moderator can change video");
      return;
    }

    const id = extractVideoId(videoUrl);

    if (!id) {
      alert("Invalid URL");
      return;
    }

    sendMessage("/app/changeVideo", { roomId, videoId: id });
    setVideoUrl("");
  };

  const handlePlay = () => {
    if (role !== "HOST" && role !== "MODERATOR") return;
    sendMessage("/app/play", roomId);
  };

  const handlePause = () => {
    if (role !== "HOST" && role !== "MODERATOR") return;
    sendMessage("/app/pause", roomId);
  };


  const handleSeek = () => {
    if (role !== "HOST" && role !== "MODERATOR") return;
    sendMessage("/app/seek", { roomId, time: 30 });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      
      <div className="flex-1 p-6">

        <div className="flex justify-between mb-4">
          <h2>Room: {roomId}</h2>

          <button
            onClick={() => setInviteOpen(true)}
            className="bg-green-500 px-3 py-2 rounded"
          >
            Invite
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Paste YouTube URL"
            className="flex-1 p-2 bg-gray-800"
            disabled={role === "PARTICIPANT"}
          />

          <button onClick={handleSetVideo} className="bg-blue-500 px-3">
            Play
          </button>
        </div>

        <Player videoId={videoId} isPlaying={isPlaying} seekTo={seekTo} />

        <div className="flex gap-3 mt-4">
          <button onClick={handlePlay} className="bg-green-500 px-3 py-2">
            Play
          </button>

          <button onClick={handlePause} className="bg-red-500 px-3 py-2">
            Pause
          </button>

          <button onClick={handleSeek} className="bg-yellow-500 px-3 py-2">
            Seek 30s
          </button>
        </div>
      </div>

      <div className="w-80 bg-gray-800 p-4">
        <h3>Participants</h3>

        {Object.values(participants).map((p) => (
          <div key={p.userId} className="bg-gray-700 p-2 mt-2">
            {p.username} ({p.role})
          </div>
        ))}
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
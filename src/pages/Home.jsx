import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Play, Users, Link2 } from "lucide-react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const createRoom = async () => {
    if (!username) return alert("Enter username");
    const res = await axios.post(
      `http://localhost:8084/api/create?username=${username}`
    );

    const user = Object.values(res.data.participants)[0];

    navigate(`/room/${res.data.roomId}`, {
      state: { userId: user.userId, username },
    });
  };

 const joinRoom = async () => {
  if (!username.trim() || !roomId.trim()) {
  return alert("Fill all fields");
}

  try {
    const res = await axios.post(
      `http://localhost:8084/api/join?roomId=${roomId}&username=${username}`
    );

    const participants = Object.values(res.data.participants);

    let user = participants.find(
      (p) => p.username.toLowerCase() === username.toLowerCase()
    );

    if (!user && participants.length > 0) {
      user = participants[participants.length - 1];
    }

    if (!user) {
      alert("❌ Unable to join room");
      return;
    }

    localStorage.setItem("user", JSON.stringify({
      userId: user.userId,
      username
    }));

    navigate(`/room/${roomId}`, {
      state: { userId: user.userId, username },
    });

  } catch (err) {
    console.log(err);
    alert("❌ Room not found or server error");
  }
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
      <div className="flex justify-between items-center px-8 py-4">
        <h1 className="text-2xl font-bold text-green-400">WATCH PARTY</h1>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-gray-700 rounded-lg">My Rooms</button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-between px-10">
        <div className="max-w-lg">
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Watch videos together with friends anywhere 🎬
          </h2>
          <p className="text-gray-300 mb-6">
            Create a room, invite friends and enjoy synchronized YouTube videos in real-time.
          </p>

          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full p-3 mb-4 bg-gray-700 rounded-lg focus:outline-none"
            />

            <button
              onClick={createRoom}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 transition p-3 rounded-lg mb-4"
            >
              <Play size={18} /> Create Room
            </button>

            <div className="flex gap-2">
              <input
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Room ID"
                className="flex-1 p-3 bg-gray-700 rounded-lg focus:outline-none"
              />
              <button
                onClick={joinRoom}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 transition px-4 rounded-lg"
              >
                <Link2 size={18} /> Join
              </button>
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl w-[500px]">
            <img
              src="https://images.unsplash.com/photo-1601933470096-0e34634ffcde"
              alt="video"
              className="w-full h-64 object-cover"
            />
            <div className="p-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400">Now Playing</p>
                <Users size={18} />
              </div>
              <div className="mt-3 h-2 bg-gray-700 rounded-full">
                <div className="w-1/3 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-4 text-gray-500 text-sm">
        No login required • Fast • Real-time sync ⚡
      </div>
    </div>
  );
}

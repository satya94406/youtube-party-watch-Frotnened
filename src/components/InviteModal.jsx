import { useState } from "react";

const InviteModal = ({ closeInviteModal, roomId }) => {
  const [copied, setCopied] = useState(false);

  const link = `${window.location.origin}/room/${roomId}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-xl w-[400px] text-white">
        <h2 className="text-xl mb-4">Invite Friends 🎉</h2>

        <input value={link} readOnly className="w-full p-2 bg-gray-800 rounded" />

        <button onClick={copy} className="mt-3 w-full bg-green-500 p-2 rounded">
          {copied ? "Copied!" : "Copy Link"}
        </button>

        <button
          onClick={closeInviteModal}
          className="mt-2 w-full bg-red-500 p-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default InviteModal;
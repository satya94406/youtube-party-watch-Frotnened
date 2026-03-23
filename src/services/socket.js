import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let stompClient = null;

export const connectSocket = (roomId, onMessage, userId, username) => {
  const socket = new SockJS("http://localhost:8084/ws");

  stompClient = new Client({
    webSocketFactory: () => socket,
    onConnect: () => {
      console.log("Connected");

      stompClient.subscribe(`/topic/room/${roomId}`, (msg) => {
        const data = JSON.parse(msg.body);
        onMessage(data);
      });

      stompClient.publish({
        destination: "/app/join",
        body: JSON.stringify({
          roomId,
          userId,
          username,
        }),
      });
    },
  });

  stompClient.activate();
};

export const sendMessage = (destination, body) => {
  if (stompClient) {
    stompClient.publish({
      destination,
      body: JSON.stringify(body),
    });
  }
};
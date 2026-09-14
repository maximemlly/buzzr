import { io } from "socket.io-client";
import { getToken } from "./api.js";

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "http://localhost:3000";

let socket = null;

export function connectSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token: getToken() ?? "" },
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

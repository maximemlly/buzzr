const { Server } = require("socket.io");
const registerGameHandler = require("../sockets/gameHandler");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ["GET", "POST"],
    },
  });

  registerGameHandler(io);
  return io;
}

module.exports = initSocket;

const { Server } = require("socket.io");
const { getAllowedOrigins } = require("./cors");
const registerGameHandler = require("../sockets/gameHandler");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ["GET", "POST"],
    },
  });

  registerGameHandler(io);
  return io;
}

module.exports = initSocket;

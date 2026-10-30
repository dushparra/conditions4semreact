import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createApp } from "./app.js";
import { addMessage } from "./data/messages.js";
import { getUserIdByToken, getUserById } from "./data/users.js";

const PORT = process.env.PORT || 3001;

function startServer() {
  const webSocketClients = new Set();

  const broadcastMessage = (message) => {
    const payload = JSON.stringify({ type: "message:new", payload: message });
    webSocketClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  };

  const app = createApp({ broadcastMessage });
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on("connection", (socket) => {
    webSocketClients.add(socket);

    socket.send(
      JSON.stringify({
        type: "status",
        payload: "соединение установлено"
      })
    );

    socket.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message.type === "message:send") {
          const { token, text } = message.payload || {};
          if (!text) {
            socket.send(
              JSON.stringify({
                type: "error",
                payload: "Текст обязателен"
              })
            );
            return;
          }

          const userId = getUserIdByToken(token);
          if (!userId) {
            socket.send(
              JSON.stringify({
                type: "error",
                payload: "Нет доступа: авторизуйтесь"
              })
            );
            return;
          }

          const user = getUserById(userId);
          const newMessage = addMessage({
            id: `m${Date.now()}`,
            userId,
            author: user.nickname,
            text,
            createdAt: new Date().toISOString()
          });

          broadcastMessage(newMessage);
        }
      } catch (error) {
        socket.send(
          JSON.stringify({
            type: "error",
            payload: "Неверный формат сообщения"
          })
        );
      }
    });

    socket.on("close", () => webSocketClients.delete(socket));
  });

  server.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
    console.log(`Swagger UI: http://localhost:${PORT}/docs`);
    console.log(`WebSocket ws://localhost:${PORT}`);
  });
}

startServer();

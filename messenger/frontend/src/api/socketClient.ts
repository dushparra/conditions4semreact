import { isMessage, type Message } from "../types";
import { ApiError } from "../helpers/handleError";
import { parseJson } from "../helpers/http";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3001";
export type SocketStatus = "connected" | "disconnected";

type SocketCallbacks = {
  onMessage: (message: Message) => void;
  onStatus: (status: SocketStatus) => void;
  onError: (error: unknown) => void;
};

export function connectSocket(token: string, callbacks: SocketCallbacks) {
  const socket = new WebSocket(WS_URL);
  let disconnected = false;

  socket.onopen = () => callbacks.onStatus("connected");
  socket.onclose = () => {
    if (!disconnected) callbacks.onStatus("disconnected");
  };
  socket.onerror = () => {
    if (!disconnected) {
      callbacks.onStatus("disconnected");
      callbacks.onError(new Error("Не удалось подключиться к WebSocket. Попробуйте подключиться снова."));
    }
  };
  socket.onmessage = (event) => {
    if (disconnected) return;
    try {
      const data = parseJson(event.data);
      if (!data || typeof data !== "object" || !("type" in data) || !("payload" in data)) {
        throw new Error("Сервер прислал неверный формат события WebSocket.");
      }
      if (data.type === "message:new") {
        if (!isMessage(data.payload)) throw new Error("Сервер прислал неверное сообщение.");
        callbacks.onMessage(data.payload);
      }
      if (data.type === "error") {
        const message = typeof data.payload === "string" ? data.payload : "Ошибка WebSocket.";
        throw new ApiError(message, message.includes("авторизуйтесь") ? 401 : undefined);
      }
    } catch (error) {
      callbacks.onError(error);
    }
  };

  return {
    sendMessage(text: string) {
      if (socket.readyState !== WebSocket.OPEN) throw new Error("Нет соединения с чатом.");
      if (!text.trim()) throw new Error("Введите текст сообщения.");
      socket.send(JSON.stringify({ type: "message:send", payload: { text: text.trim(), token } }));
    },
    disconnect() {
      disconnected = true;
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    }
  };
}

export type SocketClient = ReturnType<typeof connectSocket>;

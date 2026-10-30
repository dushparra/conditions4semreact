import { useEffect, useRef, useState } from "react";
import { getMessages, sendMessage } from "../api/messageApi";
import { connectSocket, type SocketClient, type SocketStatus } from "../api/socketClient";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import { handleError, isUnauthorized } from "../helpers/handleError";
import type { Message } from "../types";

type Props = { token: string; currentUserId?: string; onUnauthorized: () => void };

// POST и WebSocket возвращают одно сообщение: объединяем по id, без дублей.
// Так же сохраняем события, пришедшие, пока загружалась история.
function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const unique = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => unique.set(message.id, message));
  return Array.from(unique.values()).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export function ChatPage({ token, currentUserId, onUnauthorized }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("disconnected");
  const [transport, setTransport] = useState<"socket" | "http">("socket");
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const socketRef = useRef<SocketClient | null>(null);

  useEffect(() => {
    let active = true;
    setSocketStatus("disconnected");
    setError("");

    async function loadHistory() {
      setLoading(true);
      setHistoryError("");
      try {
        const history = await getMessages(token);
        if (active) setMessages((current) => mergeMessages(history, current));
      } catch (error) {
        if (!active) return;
        if (isUnauthorized(error)) onUnauthorized();
        else setHistoryError(handleError(error));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadHistory();
    try {
      socketRef.current = connectSocket(token, {
        onMessage: (message) => {
          if (active) setMessages((current) => mergeMessages(current, [message]));
        },
        onStatus: (status) => {
          if (!active) return;
          setSocketStatus(status);
          // Догружаем сообщения, которые могли появиться до открытия сокета.
          if (status === "connected") void loadHistory();
        },
        onError: (error) => {
          if (!active) return;
          if (isUnauthorized(error)) onUnauthorized();
          else setError(handleError(error));
        }
      });
    } catch (error) {
      setError(handleError(error));
    }
    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [token, onUnauthorized, connectionAttempt]);

  async function handleSend(text: string): Promise<boolean> {
    if (sending || socketStatus !== "connected") return false;
    setSending(true);
    setError("");
    try {
      if (transport === "http") {
        const message = await sendMessage(token, text);
        setMessages((current) => mergeMessages(current, [message]));
      } else {
        if (!socketRef.current) throw new Error("Нет соединения с чатом.");
        socketRef.current.sendMessage(text);
      }
      return true;
    } catch (error) {
      if (isUnauthorized(error)) onUnauthorized();
      else setError(handleError(error));
      return false;
    } finally {
      setSending(false);
    }
  }

  return (
    <section>
      <div className="page-heading"><div><p className="eyebrow">На связи</p>
        <h1>Общий чат</h1><p className="muted">Одно пространство для всех участников.</p></div>
        <span className={`socket-status ${socketStatus}`} role="status">{socketStatus}</span>
      </div>
      <div className="panel chat-panel">
        <div className="chat-toolbar">
          <span className="small muted">История и новые сообщения</span>
          <button className="button-secondary" disabled={loading || sending}
            onClick={() => setConnectionAttempt((value) => value + 1)}>
            {socketStatus === "connected" ? "Обновить чат" : "Подключиться снова"}
          </button>
        </div>
        {loading && <p className="loading" role="status">Загрузка сообщений...</p>}
        {historyError && <p className="error" role="alert">{historyError}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <MessageList messages={messages} currentUserId={currentUserId} />
        <div className="composer">
          <div className="transport-choice">
            <label htmlFor="transport">Способ отправки</label>
            <select id="transport" value={transport} disabled={sending}
              onChange={(event) => setTransport(event.target.value as "socket" | "http")}>
              <option value="socket">WebSocket</option>
              <option value="http">HTTP (Axios POST)</option>
            </select>
          </div>
          <MessageInput onSend={handleSend} disabled={socketStatus !== "connected"} sending={sending} />
          {socketStatus === "disconnected" && <p className="small muted">Для отправки восстановите соединение с чатом.</p>}
        </div>
      </div>
    </section>
  );
}

export default ChatPage;

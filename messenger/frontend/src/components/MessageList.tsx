import { useEffect, useRef } from "react";
import type { Message } from "../types";

type Props = { messages: Message[]; currentUserId?: string };

export function MessageList({ messages, currentUserId }: Props) {
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  if (!messages.length) return <p className="empty-state">Пока нет сообщений. Напишите первым!</p>;

  return (
    <ol className="message-list" ref={listRef} aria-label="Сообщения" aria-live="polite">
      {messages.map((message) => (
        <li key={message.id} className={message.userId === currentUserId ? "message own-message" : "message"}>
          <div className="message-meta"><strong>{message.author}</strong>
            <time dateTime={message.createdAt} title={new Date(message.createdAt).toLocaleString("ru-RU")}>
              {new Date(message.createdAt).toLocaleString("ru-RU", {
                day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
              })}
            </time>
          </div>
          <p>{message.text}</p>
        </li>
      ))}
    </ol>
  );
}

export default MessageList;

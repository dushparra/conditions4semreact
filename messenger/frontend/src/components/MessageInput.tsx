import { useState, type FormEvent } from "react";

type Props = {
  onSend: (text: string) => Promise<boolean>;
  disabled: boolean;
  sending: boolean;
};

export function MessageInput({ onSend, disabled, sending }: Props) {
  const [text, setText] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled || sending) return;
    // Если HTTP-запрос завершился ошибкой, оставляем текст для повторной отправки.
    if (await onSend(trimmed)) setText("");
  }

  return (
    <form onSubmit={handleSubmit} className="message-input">
      <label className="sr-only" htmlFor="message-text">Сообщение</label>
      <input id="message-text" type="text" autoComplete="off" placeholder="Напишите сообщение..."
        value={text} onChange={(event) => setText(event.target.value)} disabled={disabled || sending} />
      <button type="submit" disabled={disabled || sending || !text.trim()}>
        {sending ? "Отправляем..." : "Отправить"}
      </button>
    </form>
  );
}

export default MessageInput;

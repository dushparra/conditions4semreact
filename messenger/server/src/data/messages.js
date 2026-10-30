export const messages = [
  {
    id: "m1",
    userId: "u1",
    author: "Alex",
    text: "Привет! Это история сообщений.",
    createdAt: "2026-03-16T10:00:00Z"
  },
  {
    id: "m2",
    userId: "u2",
    author: "Maria",
    text: "Всем привет, я только что залогинилась.",
    createdAt: "2026-03-16T10:05:00Z"
  },
  {
    id: "m3",
    userId: "u3",
    author: "Sam",
    text: "Я проверяю сокеты, отправляю сообщение.",
    createdAt: "2026-03-16T10:10:00Z"
  }
];

export function addMessage({ id, userId, author, text, createdAt }) {
  const message = { id, userId, author, text, createdAt };
  messages.push(message);
  return message;
}

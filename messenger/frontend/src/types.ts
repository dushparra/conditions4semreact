export type User = {
  id: string;
  nickname: string;
  phone: string;
  bio: string;
};

export type Message = {
  id: string;
  userId: string;
  author: string;
  text: string;
  createdAt: string;
};

// Типы TypeScript сами не проверяют данные, полученные от сервера.
export function isUser(value: unknown): value is User {
  return value !== null && typeof value === "object"
    && "id" in value && typeof value.id === "string"
    && "nickname" in value && typeof value.nickname === "string"
    && "phone" in value && typeof value.phone === "string"
    && "bio" in value && typeof value.bio === "string";
}

export function isMessage(value: unknown): value is Message {
  return value !== null && typeof value === "object"
    && "id" in value && typeof value.id === "string"
    && "userId" in value && typeof value.userId === "string"
    && "author" in value && typeof value.author === "string"
    && "text" in value && typeof value.text === "string"
    && "createdAt" in value && typeof value.createdAt === "string"
    && !Number.isNaN(Date.parse(value.createdAt));
}

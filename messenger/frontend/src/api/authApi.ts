import { isUser, type User } from "../types";
import { http, parseJson } from "../helpers/http";

export type LoginPayload = { phone: string; password: string };
export type LoginResponse = { token: string; user: User };

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await http.post<string>("/auth/login", payload);
  const data = parseJson(response.data);
  if (!data || typeof data !== "object"
    || !("token" in data) || typeof data.token !== "string" || !data.token.trim()
    || !("user" in data) || !isUser(data.user)) {
    throw new Error("Сервер вернул неверные данные авторизации.");
  }
  return { token: data.token, user: data.user };
}

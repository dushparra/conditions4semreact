import { isUser, type User } from "../types";
import { API_URL, authHeaders, http, parseJson, readFetchResponse } from "../helpers/http";

export async function getProfile(token: string): Promise<User> {
  const response = await fetch(`${API_URL}/users/me`, {
    headers: authHeaders(token),
    signal: AbortSignal.timeout(10000)
  });
  const data = await readFetchResponse(response);
  if (!isUser(data)) throw new Error("Сервер вернул неверные данные профиля.");
  return data;
}

export type UpdateProfilePayload = Pick<User, "nickname" | "bio">;

export async function updateProfile(token: string, payload: UpdateProfilePayload): Promise<User> {
  const response = await http.put<string>("/users/me", payload, { headers: authHeaders(token) });
  const data = parseJson(response.data);
  if (!isUser(data)) throw new Error("Сервер вернул неверные данные профиля.");
  return data;
}

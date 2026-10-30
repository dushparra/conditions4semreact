import { isMessage, type Message } from "../types";
import { API_URL, authHeaders, http, parseJson, readFetchResponse } from "../helpers/http";

export async function getMessages(token: string): Promise<Message[]> {
  const response = await fetch(`${API_URL}/messages`, {
    headers: authHeaders(token),
    signal: AbortSignal.timeout(10000)
  });
  const data = await readFetchResponse(response);
  if (!Array.isArray(data) || !data.every(isMessage)) {
    throw new Error("Сервер вернул неверный список сообщений.");
  }
  return data;
}

export async function sendMessage(token: string, text: string): Promise<Message> {
  const response = await http.post<string>("/messages", { text }, { headers: authHeaders(token) });
  const data = parseJson(response.data);
  if (!isMessage(data)) throw new Error("Сервер вернул неверные данные сообщения.");
  return data;
}

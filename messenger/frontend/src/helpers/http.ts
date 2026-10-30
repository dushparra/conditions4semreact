import axios from "axios";
import { ApiError, getErrorMessage } from "./handleError";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

// Читаем текст и сами разбираем JSON, чтобы отличать пустой и повреждённый ответ.
export const http = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  responseType: "text"
});

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function parseJson(text: string): unknown {
  if (!text.trim()) throw new ApiError("Сервер вернул пустой ответ.");
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError("Сервер вернул некорректный JSON.");
  }
}

export async function readFetchResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  // Проверяем статус до разбора JSON, чтобы обработать даже 401 с пустым телом.
  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(text) || `Ошибка запроса (${response.status}).`,
      response.status
    );
  }
  return parseJson(text);
}

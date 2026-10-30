import axios from "axios";

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function isUnauthorized(error: unknown): boolean {
  return (error instanceof ApiError && error.status === 401)
    || (axios.isAxiosError(error) && error.response?.status === 401);
}

// Axios может вернуть тело ошибки строкой, например при responseType: "text".
export function getErrorMessage(data: unknown): string | null {
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (data && typeof data === "object" && "message" in data) {
    return typeof data.message === "string" ? data.message : null;
  }
  return null;
}

export function handleError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return getErrorMessage(error.response.data)
        || `Ошибка запроса (${error.response.status}).`;
    }
    if (error.code === "ECONNABORTED") {
      return "Сервер не ответил вовремя. Попробуйте ещё раз.";
    }
    return "Не удалось связаться с сервером. Проверьте подключение и запуск бэкенда.";
  }
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  }
  if (error instanceof TypeError) {
    return "Не удалось связаться с сервером. Проверьте подключение и запуск бэкенда.";
  }
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Произошла неизвестная ошибка. Попробуйте ещё раз.";
}

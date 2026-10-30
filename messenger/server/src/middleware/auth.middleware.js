import { getUserIdByToken, getUserById } from "../data/users.js";

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Токен авторизации обязателен" });
  }

  const userId = getUserIdByToken(token);
  if (!userId) {
    return res.status(401).json({ message: "Неверный или просроченный токен" });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(401).json({ message: "Пользователь не найден" });
  }

  req.user = user;
  return next();
}

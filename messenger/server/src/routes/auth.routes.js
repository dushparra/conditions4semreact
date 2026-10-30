import { Router } from "express";
import { findUserByPhone, issueToken } from "../data/users.js";

const router = Router();

router.post("/login", (req, res) => {
  const { phone, password } = req.body || {};

  if (!phone || !password) {
    return res.status(400).json({ message: "Телефон и пароль обязательны" });
  }

  const user = findUserByPhone(phone);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Неверный телефон или пароль" });
  }

  const token = issueToken(user.id);
  const { password: _, ...safeUser } = user;

  return res.json({ token, user: safeUser });
});

export default router;

import { Router } from "express";
import { authRequired } from "../middleware/auth.middleware.js";
import { users } from "../data/users.js";

const router = Router();

router.get("/me", authRequired, (req, res) => {
  const { password, ...safeUser } = req.user;
  return res.json(safeUser);
});

router.put("/me", authRequired, (req, res) => {
  const { nickname, bio } = req.body || {};
  const userIndex = users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "Пользователь не найден" });
  }

  if (nickname !== undefined) {
    users[userIndex].nickname = nickname;
  }

  if (bio !== undefined) {
    users[userIndex].bio = bio;
  }

  const { password, ...safeUser } = users[userIndex];
  return res.json(safeUser);
});

export default router;

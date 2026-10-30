import { Router } from "express";
import { authRequired } from "../middleware/auth.middleware.js";
import { messages, addMessage } from "../data/messages.js";

export function createMessagesRouter(broadcastMessage) {
  const router = Router();

  router.get("/", authRequired, (req, res) => {
    return res.json(messages);
  });

  router.post("/", authRequired, (req, res) => {
    const { text } = req.body || {};
    if (!text) {
      return res.status(400).json({ message: "Текст обязателен" });
    }

    const message = addMessage({
      id: `m${Date.now()}`,
      userId: req.user.id,
      author: req.user.nickname,
      text,
      createdAt: new Date().toISOString()
    });

    if (broadcastMessage) {
      broadcastMessage(message);
    }

    return res.status(201).json(message);
  });

  return router;
}

export default createMessagesRouter;

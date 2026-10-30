import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import { createMessagesRouter } from "./routes/messages.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadSwaggerDoc() {
  const swaggerPath = path.join(__dirname, "swagger", "openapi.yaml");
  return YAML.load(swaggerPath);
}

export function createApp({ broadcastMessage }) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/auth", authRoutes);
  app.use("/users", usersRoutes);
  app.use("/messages", createMessagesRouter(broadcastMessage));

  const swaggerDocument = loadSwaggerDoc();
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get("/", (_req, res) => {
    res.send("Messenger Mini API is running");
  });

  app.use((err, _req, res, _next) => {
    // minimal fallback error handler
    console.error(err);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  });

  return app;
}

export default createApp;

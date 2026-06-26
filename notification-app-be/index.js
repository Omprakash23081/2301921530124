import express from "express";
import dotenv from "dotenv";
import notificationRoutes from "./routes/notificationRoutes.js";
import { loggingMiddleware } from "../logging-middleware/logger.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(loggingMiddleware);

app.use("/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("Server Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
});

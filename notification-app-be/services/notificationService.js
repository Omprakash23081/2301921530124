import axios from "axios";
import dotenv from "dotenv";
import { Log, getValidToken } from "../../logging-middleware/logger.js";
import { getTopTenPriorityNotifications } from "../utils/priority.js";

dotenv.config();

const BASE_URL = process.env.BASE_URL;

export const getNotifications = async (req, res) => {
  try {
    await Log("backend", "info", "service", "Fetching notifications");

    const token = await getValidToken();

    const response = await axios.get(`${BASE_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await Log(
      "backend",
      "info",
      "service",
      "Notifications fetched successfully",
    );

    const rawNotifications = response.data.notifications || [];
    const topTen = getTopTenPriorityNotifications(rawNotifications);

    res.status(200).json({ notifications: topTen });
  } catch (error) {
    await Log("backend", "error", "service", error.message);

    res.status(error.response?.status || 500).json({
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

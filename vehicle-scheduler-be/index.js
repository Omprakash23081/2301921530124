import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import { Log, getValidToken, loggingMiddleware } from "../logging-middleware/logger.js";
import { verifyJwt } from "./middleware/auth.js";
import { solveKnapsack } from "./utils/knapsack.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(loggingMiddleware);

const BASE_URL = process.env.BASE_URL || "http://4.224.186.213/evaluation-service";

app.get("/schedule", verifyJwt, async (req, res) => {
  try {
    await Log("backend", "info", "service", "Starting vehicle maintenance scheduling calculation");

    const token = await getValidToken();
    const headers = { Authorization: `Bearer ${token}` };

    // 1. Fetch depots
    await Log("backend", "info", "service", "Fetching depots from external API");
    const depotsResponse = await axios.get(`${BASE_URL}/depots`, { headers });
    const depots = depotsResponse.data.depots || [];

    // 2. Fetch vehicle tasks
    await Log("backend", "info", "service", "Fetching vehicles/tasks from external API");
    const vehiclesResponse = await axios.get(`${BASE_URL}/vehicles`, { headers });
    const tasks = vehiclesResponse.data.vehicles || [];

    await Log("backend", "info", "service", `Successfully fetched ${depots.length} depots and ${tasks.length} tasks`);

    // 3. Find best combination for each depot
    const schedules = depots.map(depot => {
      const result = solveKnapsack(tasks, depot.MechanicHours);
      return {
        depotId: depot.ID,
        mechanicHours: depot.MechanicHours,
        selectedTasks: result.selectedTasks,
        totalDuration: result.totalDuration,
        totalImpact: result.totalImpact
      };
    });

    await Log("backend", "info", "service", "Completed knapsack calculation for all depots");

    res.status(200).json(schedules);
  } catch (error) {
    await Log("backend", "error", "service", `Scheduling error: ${error.message}`);
    console.error("Scheduler error:", error);
    res.status(error.response?.status || 500).json({
      message: "Failed to generate schedule",
      error: error.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("Vehicle Scheduler Server Running");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Vehicle Scheduler started on ${PORT}`);
});

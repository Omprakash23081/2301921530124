import { spawn } from "child_process";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("./logging-middleware/.env") });

const BASE_URL = "http://4.224.186.213/evaluation-service";

const credentials = {
  email: "csaiml23081@glbitm.ac.in",
  name: "om prakash kumar",
  rollNo: "2301921530124",
  accessCode: "xxkJnk",
  clientID: "8f850f9d-3873-4093-bc27-2da500fd9bcb",
  clientSecret: "FHPydmZvhnuwdkgH"
};

async function getNewToken() {
  const response = await axios.post(`${BASE_URL}/auth`, credentials);
  return response.data.access_token;
}

function startServer(dir, port) {
  console.log(`Starting server in ${dir} on port ${port}...`);
  const child = spawn("node", ["index.js"], {
    cwd: path.resolve(dir),
    stdio: "inherit",
    env: { ...process.env, PORT: port }
  });
  return child;
}

async function runTests() {
  let notificationServer = null;
  let schedulerServer = null;
  
  try {
    // 1. Get fresh token
    console.log("Fetching fresh JWT token...");
    const token = await getNewToken();
    const authHeader = `Bearer ${token}`;
    console.log("JWT obtained successfully.");

    // 2. Start servers
    notificationServer = startServer("./notification-app-be", "3000");
    schedulerServer = startServer("./vehicle-scheduler-be", "3001");
    
    // Wait for servers to startup
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log("\n--- Testing Campus Notifications Microservice (Port 3000) ---");
    
    // Test auth protection (request without header)
    try {
      console.log("Requesting notifications without Auth Header (Expecting 401)...");
      await axios.get("http://localhost:3000/notifications");
      console.error("FAIL: Request succeeded but should have failed with 401!");
      process.exit(1);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log("SUCCESS: Blocked with 401.");
      } else {
        console.error("FAIL: Unexpected error:", err.message);
        process.exit(1);
      }
    }
    
    // Test authenticated request
    console.log("Requesting notifications with valid token...");
    const notifRes = await axios.get("http://localhost:3000/notifications", {
      headers: { Authorization: authHeader }
    });
    console.log("Response status:", notifRes.status);
    console.log("Notifications returned count:", notifRes.data.notifications.length);
    console.log("Sample notification:", notifRes.data.notifications[0]);
    
    // Check sorting logic
    const notifs = notifRes.data.notifications;
    let sortingCorrect = true;
    const priorityMap = { "Placement": 3, "Result": 2, "Event": 1 };
    
    for (let i = 1; i < notifs.length; i++) {
      const prev = notifs[i - 1];
      const curr = notifs[i];
      const pPrev = priorityMap[prev.Type] || 0;
      const pCurr = priorityMap[curr.Type] || 0;
      
      if (pPrev < pCurr) {
        sortingCorrect = false;
        console.error(`FAIL: Sorting violation at index ${i}. Prev type: ${prev.Type}, Curr type: ${curr.Type}`);
      } else if (pPrev === pCurr) {
        const dPrev = new Date(prev.Timestamp);
        const dCurr = new Date(curr.Timestamp);
        if (dPrev < dCurr) {
          sortingCorrect = false;
          console.error(`FAIL: Recency violation at index ${i}. Prev: ${prev.Timestamp}, Curr: ${curr.Timestamp}`);
        }
      }
    }
    if (sortingCorrect && notifs.length === 10) {
      console.log("SUCCESS: Sorting and count constraints satisfied!");
    } else {
      console.error("FAIL: Sorting or count constraint violation");
      process.exit(1);
    }

    console.log("\n--- Testing Vehicle Maintenance Scheduler (Port 3001) ---");
    
    // Test auth protection (request without header)
    try {
      console.log("Requesting schedule without Auth Header (Expecting 401)...");
      await axios.get("http://localhost:3001/schedule");
      console.error("FAIL: Request succeeded but should have failed with 401!");
      process.exit(1);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log("SUCCESS: Blocked with 401.");
      } else {
        console.error("FAIL: Unexpected error:", err.message);
        process.exit(1);
      }
    }
    
    // Test authenticated request
    console.log("Requesting schedule with valid token...");
    const schedRes = await axios.get("http://localhost:3001/schedule", {
      headers: { Authorization: authHeader }
    });
    console.log("Response status:", schedRes.status);
    console.log("Depots schedule computed count:", schedRes.data.length);
    console.log("Sample Depot Schedule:", JSON.stringify(schedRes.data[0], null, 2));
    
    // Validate knapsack logic
    for (const depot of schedRes.data) {
      const computedDuration = depot.selectedTasks.reduce((sum, t) => sum + t.Duration, 0);
      const computedImpact = depot.selectedTasks.reduce((sum, t) => sum + t.Impact, 0);
      
      if (computedDuration > depot.mechanicHours) {
        console.error(`FAIL: Depot ${depot.depotId} exceeded capacity! Duration ${computedDuration} > Limit ${depot.mechanicHours}`);
        process.exit(1);
      }
      if (computedDuration !== depot.totalDuration || computedImpact !== depot.totalImpact) {
        console.error(`FAIL: Summary mismatch for Depot ${depot.depotId}`);
        process.exit(1);
      }
    }
    console.log("SUCCESS: Scheduler constraints and Knapsack capacity rules validated!");

    console.log("\nALL TESTS PASSED SUCCESSFULLY! ✅");
    process.exit(0);

  } catch (error) {
    console.error("Test execution failed with error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    process.exit(1);
  } finally {
    if (notificationServer) notificationServer.kill();
    if (schedulerServer) schedulerServer.kill();
  }
}

runTests();

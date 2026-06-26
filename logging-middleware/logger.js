import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const VALID_STACKS = ["backend", "frontend"];

const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];

const VALID_PACKAGES = [
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
  "auth",
  "config",
  "middleware",
  "utils",
];

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(Buffer.from(base64, 'base64').toString().split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

let cachedToken = null;
let tokenExpiry = 0;

export async function getValidToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  const email = process.env.EMAIL;
  const name = process.env.NAME;
  const rollNo = process.env.ROLL_NO;
  const accessCode = process.env.ACCESS_CODE;
  const clientID = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const baseUrl = process.env.BASE_URL || "http://4.224.186.213/evaluation-service";

  try {
    const response = await axios.post(`${baseUrl}/auth`, {
      email,
      name,
      rollNo,
      accessCode,
      clientID,
      clientSecret
    });

    cachedToken = response.data.access_token;
    const payload = parseJwt(cachedToken);
    if (payload && payload.MapClaims && payload.MapClaims.exp) {
      tokenExpiry = payload.MapClaims.exp * 1000;
    } else {
      tokenExpiry = Date.now() + 14 * 60 * 1000;
    }

    process.env.ACCESS_TOKEN = `Bearer ${cachedToken}`;
    return cachedToken;
  } catch (error) {
    console.error("Failed to refresh token in logger:", error.message);
    if (process.env.ACCESS_TOKEN) {
      return process.env.ACCESS_TOKEN.replace("Bearer ", "");
    }
    throw error;
  }
}

export async function Log(stack, level, packageName, message) {
  if (!VALID_STACKS.includes(stack)) throw new Error("Invalid stack");

  if (!VALID_LEVELS.includes(level)) throw new Error("Invalid level");

  if (!VALID_PACKAGES.includes(packageName)) throw new Error("Invalid package");

  try {
    const token = await getValidToken();
    const baseUrl = process.env.BASE_URL || "http://4.224.186.213/evaluation-service";

    const response = await axios.post(
      `${baseUrl}/logs`,
      {
        stack,
        level,
        package: packageName,
        message: message.substring(0, 48),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Log dispatch failed:", error.message);
    if (error.response) {
      console.error("Log dispatch error details:", JSON.stringify(error.response.data));
    }
    return null;
  }
}

export async function loggingMiddleware(req, res, next) {
  const start = Date.now();
  res.on("finish", async () => {
    try {
      const duration = Date.now() - start;
      await Log("backend", "info", "middleware", `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    } catch (err) {
      console.error("Logger middleware error:", err.message);
    }
  });
  next();
}


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

function validate(value, validValues, fieldName) {
  if (!validValues.includes(value)) {
    throw new Error(
      `Invalid ${fieldName} "${value}". Allowed values: ${validValues.join(", ")}`,
    );
  }
}

export async function Log(stack, level, packageName, message) {
  validate(stack, VALID_STACKS, "stack");
  validate(level, VALID_LEVELS, "level");
  validate(packageName, VALID_PACKAGES, "package");

  try {
    const { data } = await axios.post(
      `${process.env.BASE_URL}/logs`,
      {
        stack,
        level,
        package: packageName,
        message,
      },
      {
        headers: {
          Authorization: process.env.ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      },
    );

    return data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `Logging API Error (${error.response.status}): ${
          error.response.data.message || JSON.stringify(error.response.data)
        }`,
      );
    }

    throw new Error(`Failed to send log: ${error.message}`);
  }
}

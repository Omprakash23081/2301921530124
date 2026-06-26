import { Log } from "./logger.js";

async function testLogger() {
  try {
    const response = await Log(
      "backend",
      "info",
      "service",
      "Testing logging middleware",
    );

    console.log("Success:", response);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testLogger();

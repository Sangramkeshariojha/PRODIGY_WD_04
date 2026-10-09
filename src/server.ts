
import "dotenv/config";
import express from "express";
import { createClient } from "redis";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("error", (error) => {
  console.error("Redis error:", error.message);
});

const CACHE_KEY = "users:all";
const CACHE_TTL = Number(process.env.CACHE_TTL) || 60;

// Start the server and connect to Redis
async function startServer() {
  await redis.connect();

  // Health check
  app.get("/health", async (_req, res) => {
    res.json({
      status: "ok",
      redis: redis.isReady ? "connected" : "disconnected",
    });
  });

  // GET: Fetch all users with Redis caching
  app.get("/users", async (_req, res) => {
    try {
      const cachedUsers = await redis.get(CACHE_KEY);

      if (cachedUsers !== null) {
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(cachedUsers));
      }

      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
      });

      await redis.set(CACHE_KEY, JSON.stringify(users), {
        EX: CACHE_TTL,
      });

      res.setHeader("X-Cache", "MISS");
      return res.json(users);
    } catch (error) {
      console.error("GET /users error:", error);
      return res.status(500).json({
        error: "Failed to fetch users",
      });
    }
  });

  // POST: Create a new user and invalidate cache
  app.post("/users", async (req, res) => {
    try {
      const { name, email, age } = req.body;

      if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof email !== "string" ||
        !email.trim() ||
        !Number.isInteger(age) ||
        age < 0
      ) {
        return res.status(400).json({
          error: "Provide a name, email, and non-negative integer age",
        });
      }

      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.trim(),
          age,
        },
      });

      await redis.del(CACHE_KEY);

      return res.status(201).json(user);
    } catch (error) {
      console.error("POST /users error:", error);
      return res.status(500).json({
        error: "Failed to create user",
      });
    }
  });

  // PUT: Update a user and invalidate cache
  app.put("/users/:id", async (req, res) => {
    try {
      const { name, email, age } = req.body;

      if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof email !== "string" ||
        !email.trim() ||
        !Number.isInteger(age) ||
        age < 0
      ) {
        return res.status(400).json({
          error: "Provide a name, email, and non-negative integer age",
        });
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          name: name.trim(),
          email: email.trim(),
          age,
        },
      });

      await redis.del(CACHE_KEY);

      return res.json(user);
    } catch (error) {
      console.error("PUT /users/:id error:", error);
      return res.status(404).json({
        error: "User not found or update failed",
      });
    }
  });

  // DELETE: Delete a user and invalidate cache
  app.delete("/users/:id", async (req, res) => {
    try {
      const user = await prisma.user.delete({
        where: { id: req.params.id },
      });

      await redis.del(CACHE_KEY);

      return res.json({
        message: "User deleted successfully",
        user,
      });
    } catch (error) {
      console.error("DELETE /users/:id error:", error);
      return res.status(404).json({
        error: "User not found or delete failed",
      });
    }
  });

  // Start listening for requests
  const port = Number(process.env.PORT) || 3000;

  app.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start API:", error);
  process.exit(1);
});

// Graceful shutdown
async function shutdown() {
  try {
    if (redis.isOpen) {
      await redis.quit();
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("Shutdown error:", error);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { routes } from "./routes";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import path from "path";
import { swaggerSpec } from "./config/swagger";
import swaggerUi from "swagger-ui-express";
import { generalLimiter } from "./middlewares/rateLimiter";
import { errorMiddleware } from "./middlewares/error.middleware";
import { initCronJobs } from "./cron/fineScheduler";

dotenv.config();

const app = express();

// Trust proxy fully for secure cookie (X-Forwarded-Proto) from PaaS like Railway, Render, etc.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:4173",
      "https://library-fe-one.vercel.app"
    ],
    credentials: true
  })
);
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// Swagger UI using swagger-ui-express
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// General rate limiter for all API routes (baseline protection)
app.use("/api", generalLimiter);

// Better Auth Handler — harus SEBELUM custom routes
// agar semua /api/auth/* (sign-in/email, sign-up/email, dll) ditangani oleh
// better-auth yang bisa meng-set cookie session ke browser
app.all("/api/auth/*path", toNodeHandler(auth));

// Routes
app.use("/api", routes);

app.get("/", (req, res) => {
  res.redirect("/docs");
});

app.get("/health", (req, res) => {
  res.status(200).send("API IS OK");
});

// Error Middleware (MuST be at the end)
app.use(errorMiddleware);

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
  initCronJobs();
});

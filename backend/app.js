import express from "express";
import legacyApp from "./legacy-app.js";
import { corsMiddleware, csrfOriginGuard, securityHeaders } from "./src/config/security.js";
import { apiLimiter } from "./src/middleware/rateLimit.js";
import { errorHandler, notFound } from "./src/middleware/errorHandler.js";
import authRoutes from "./src/routes/authRoutes.js";
import lmsRoutes from "./src/routes/lmsRoutes.js";
import applicationRoutes from "./src/routes/applicationRoutes.js";
import aiRoutes from "./src/routes/aiRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";

const app=express();
app.set("trust proxy",1);
app.disable("x-powered-by");
app.use(corsMiddleware());
app.use(securityHeaders);
app.use(express.json({limit:"75mb"}));
app.use("/api",apiLimiter);
app.use(csrfOriginGuard);

// Modular routes. Existing endpoint paths and response shapes are preserved.
app.use("/api",authRoutes);
app.use("/api",applicationRoutes);
app.use("/api/ai",aiRoutes);
app.use("/api/ai",chatRoutes);
app.use("/api",lmsRoutes);
app.use("/api/admin",adminRoutes);

// Compatibility layer for admin/LMS endpoints that have not yet been extracted.
// This keeps the current React frontend fully operational during the migration.
app.use(legacyApp);

app.use(notFound);
app.use(errorHandler);
export default app;

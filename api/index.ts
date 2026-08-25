import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerPortableOAuthRoutes } from "../server/_core/portableOAuth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { streamwiseRefreshHandler } from "../server/scheduledRefresh";

/** Vercel serverless adapter. Static client files are served by Vercel from /public. */
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerStorageProxy(app);
registerOAuthRoutes(app);
registerPortableOAuthRoutes(app);
app.post("/api/scheduled/streamwise-refresh", streamwiseRefreshHandler);
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

export default app;

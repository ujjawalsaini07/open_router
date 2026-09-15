import "dotenv/config";
import express from "express";
import type { Server } from "node:http";
import cookieParser from "cookie-parser";
import {router as authRouter} from "./routes/authRoutes.ts"
import {router as apiRouter } from "./routes/apiRoutes.ts";
import {router as onrampRouter } from "./routes/transactionRoutes.ts";
import {router as providerRouter } from "./routes/providerRoutes.ts";
import {router as companyRouter } from "./routes/companyRoutes.ts";
import {router as modelRouter } from "./routes/modelRoutes.ts";
import {router as modelProviderMappingRouter } from "./routes/modelProviderMappingRoutes.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { requestLogger } from "./middleware/requestLogger.ts";
import connectDB from "./config/dbConfig.ts";

const port: number = Number(process.env.PORT) || 3000;
const app = express();


app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);


app.use("/auth" , authRouter);


app.use("/api",apiRouter);

app.use("/payments", onrampRouter);

app.use("/provider",providerRouter);
app.use("/company", companyRouter);
app.use("/model", modelRouter);
app.use("/model-provider-mapping", modelProviderMappingRouter);

app.get("/health", (req, res) => {
    res.status(200).json({
        msg: "server is healthy"
    });
});

app.use(errorHandler);

async function startServer(): Promise<void> {
    await connectDB();

    const server: Server = app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });

    server.on("error", (error) => {
        console.error("Server error:", error);
    });
}

startServer();
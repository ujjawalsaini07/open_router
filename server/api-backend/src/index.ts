import "dotenv/config";
import express from "express";
import type { Server } from "node:http";
import cookieParser from "cookie-parser";

import {router as completionsRouter} from "./routes/completionsRouter.ts";

import { errorHandler } from "./middleware/errorHandler.ts";
import { requestLogger } from "./middleware/requestLogger.ts";
import connectDB from "./config/dbConfig.ts";


const port: number = Number(process.env.PORT) || 3001;
const app = express();


app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

// completions end point 

app.use("/api/completions",completionsRouter);


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
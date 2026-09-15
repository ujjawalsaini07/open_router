import "dotenv/config";
import express from "express";
import type { Server } from "node:http";
import cookieParser from "cookie-parser";


import {router as authRouter} from "./routes/authRoutes.ts"
import {router as apiRouter } from "./routes/apiRoutes.ts";
import {router as onrampRouter } from "./routes/transactionRoutes.ts";
import {router as providerRouter } from "./routes/providerRoutes.ts";
import { errorHandler } from "./middleware/errorHandler.ts";

const port: number = Number(process.env.PORT) || 3000;
const app = express();


app.use(express.json());
app.use(cookieParser());


app.use("/auth" , authRouter);


app.use("/api",apiRouter);

app.use("/payments", onrampRouter);

app.use("/provider",providerRouter);

app.get("/health", (req, res) => {
    res.status(200).json({
        msg: "server is healthy"
    });
});

app.use(errorHandler);

const server: Server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

server.on("error", (error) => {
    console.error("Server error:", error);
});
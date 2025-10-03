import express from "express";
import { runWorkflow, type RunWorkflowResult } from "./crud";
import { redisClient } from "@repo/redis";
import { WEBHOOK_MAP } from "@repo/common-utils";

export const app = express();

app.use(async (req, res) => {
    const url = req.url;
    console.log(url);
    const workflowId = await redisClient.hGet(WEBHOOK_MAP, url);
    if (!workflowId) {
        return res.status(400).json("Webhook is not registered");
    }
    try {
        const response: RunWorkflowResult = await runWorkflow(workflowId);
        if (response.success) {
            return res.status(200).json(response.message);
        } else {
            return res.status(400).json(response.message);
        }
    } catch (e) {
        return res.status(500).json({
            message: e
        });
    }
});
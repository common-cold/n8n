import { Queue } from "bullmq";
import { createClient } from "redis";


export const redisConfig = {
    port: 6379,
    host: "127.0.0.1",
    password: ""

}

export const workflowQueue = new Queue("workflowQueue", {
    connection: redisConfig
});


export const redisClient = createClient();
await redisClient.connect();


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


export const publisherClient = await createClient()
    .on("error", (err) => 
        console.log("Could not connect Publisher Client", err)
    )
    .on("connect", () => {
        "Publisher Client Connected"
    })
.connect();

export const subscriberClient = await createClient()
    .on("error", (err) => 
        console.log("Could not connect Subscriber Client", err)
    )
    .on("connect", () => {
        "Subscriber Client Connected"
    })
.connect();
import dotenv from "dotenv";
import {join} from "path";

dotenv.config({ path: join(__dirname, "..", "..", ".env") });
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
console.log("FIRST: " + ENCRYPTION_KEY);

import {Worker} from "bullmq"
import type {Workflow} from "../../packages/db/generated/prisma";
import type {CustomNode, Connections, WorkflowIssues} from "@repo/types";
import {redisConfig} from "@repo/redis";

import { buildNodeGraph, checkWorkflowIssues, initialiseNodesOutputMap, type NodeGraph, type NodesOutput } from "./utils";

import { runSendTelegramMessage } from "./actions/telegram";
import { runSendGmailMail } from "./actions/gmail";



const workflow: Workflow = {
    id: "019963a0-807e-7281-a1c5-ac6df4cfca39",
    name: "Workflow-1",
    nodes: [
        {
            id: "af84d61c-419f-406f-99a5-119bd9af7037",
            name: "Node 1",
            position: {
                x: 151,
                y: 232
            },
            isPrimaryNode: true,
            type: "telegram.sendMessage",
            parameters: {
                chatId: 12345,
                message: "Hello Bhai"
            }
            
        },
        {
            id: "7857449e-6ef2-46a8-b4e4-ba645ef20aba",
            name: "Node-x",
            type: "telegram.sendMessage",
            position: {
                x: 585,
                y: 61
            },
            isPrimaryNode: false,
            parameters: {
                chatId: 12345,
                message: "Hello Bhai"
            }
        },
        {
            id: "e50f414f-b914-421e-ba40-b4cb2cd8f8dc",
            name: "Node-x",
            type: "gmail.sendMail",
            position: {
                x: 607,
                y: 256
            },
            isPrimaryNode: false,
            parameters: {
                to: "prajj@gmail.com",
                subject: "Test Message",
                emailType: "SMTP",
                message: "Hi there bruv"
            }
        }
    ],
    connections: [
        {
            targets: [
                {
                    targetId: "7857449e-6ef2-46a8-b4e4-ba645ef20aba",
                    connectionId: "d0ad2a67-015f-40a0-85e3-b046b0d03824"
                },
                {
                    targetId: "e50f414f-b914-421e-ba40-b4cb2cd8f8dc",
                    connectionId: "eab6ffe6-fd03-4f9e-9751-6efb6a1e810a"
                }
            ],
            sourceId: "af84d61c-419f-406f-99a5-119bd9af7037"
        }
    ],
    userId: "01994f06-dcd6-7a30-8de7-356ee6329445",
    createdAt: new Date("2025-09-19T20:18:05.563Z"),
    updatedAt: new Date("2025-09-19T20:18:05.563Z")
}

async function runWorkflow(workflow: Workflow) {
    const nodegraph: NodeGraph = new Map();
    const nodesOutput: NodesOutput = new Map();
    const nodesToRun = (workflow.nodes as CustomNode[])
        .filter(node => node.isPrimaryNode)
        .map(node => node.id);
    let visited = new Set();
    

    buildNodeGraph(workflow.nodes as CustomNode[], workflow.connections as Connections, nodegraph);
    initialiseNodesOutputMap(nodegraph, nodesOutput);

    console.log(nodegraph);
    console.log(nodesOutput);


    const issues: WorkflowIssues = checkWorkflowIssues(workflow);
    if (issues.nodeIssues.length > 0) {
        return;
    }


    while (nodesToRun.length) {
        console.log("QUEUE: " + nodesToRun);
        const nodeId = nodesToRun.shift();

        const parentIds = Object.entries(nodegraph)
            .filter(([source, targets]) => targets.includes(nodeId))
            .map(([source]) => source.toString());

        await runNode(nodeId!, parentIds);

        for (const targetId of nodegraph.get(nodeId!)!) {
            if (!visited.has(targetId)) {
                nodesToRun.push(targetId);
            }
        }
        visited.add(nodeId);
    }
    
}


async function runNode(node: string, parentIds: string[]) {
    
}


let workflowQueueWorker = new Worker("workflowQueue", async (job) => {
    const jobData: Workflow = job.data;
    await runWorkflow(jobData);
}, {
    connection: redisConfig,
    removeOnComplete: {age: 0}
});


runWorkflow(workflow);

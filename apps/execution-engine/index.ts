import dotenv from "dotenv";
import {join} from "path";

dotenv.config({ path: join(__dirname, "..", "..", ".env") });


import type {Workflow} from "../../packages/db/generated/prisma";
import type {CustomNode, Connections, WorkflowIssues} from "@repo/types"
import { buildNodeGraph, checkWorkflowIssues, initialiseNodesOutputMap, type NodeGraph, type NodesOutput } from "./utils";
import { runAction } from "./actions/action-handler";



const workflow: Workflow = {
    "id": "019988c2-1a8a-72a1-bcac-1d5eaaa65759",
    "name": "Workflow-1",
    "nodes": [
        {
            "id": "a8bee913-2bd3-4ea4-82f1-cf26501b11a3",
            "name": "Node 1",
            "position": {
                "x": 10,
                "y": 10
            },
            "credentialId": "019987ea-4cd9-7fe0-9c9c-488fe6d4fd51",
            "isPrimaryNode": true
        },
        {
            "id": "d358e142-0dae-4f97-919b-337195af60f7",
            "name": "Node-x",
            "type": "gmail.sendMail",
            "position": {
                "x": 527.1999969482422,
                "y": 314.6124954223633
            },
            "parameters": {
                "to": "prajjwalk@iitbhilai.ac.in",
                "message": "Inifnity goes brrrrrr",
                "subject": "Infinity",
                "emailType": "HTTP"
            },
            "credentialId": "019988b6-2865-7480-b994-71abd38055d2",
            "isPrimaryNode": false
        },
        {
            "id": "41aef018-517b-4184-b8d0-5adf47282a7a",
            "name": "Node-x",
            "type": "telegram.sendMessage",
            "position": {
                "x": 518.1999969482422,
                "y": 22.61249542236328
            },
            "parameters": {
                "chatId": "6679087141",
                "message": "Infinity goes brrr......"
            },
            "credentialId": "019987ea-4cd9-7fe0-9c9c-488fe6d4fd51",
            "isPrimaryNode": false
        }
    ],
    "connections": [
        {
            "targets": [
                {
                    "targetId": "d358e142-0dae-4f97-919b-337195af60f7",
                    "connectionId": "95f468f4-0945-4684-9ce9-1f6939cb944b"
                }
            ],
            "sourceId": "a8bee913-2bd3-4ea4-82f1-cf26501b11a3"
        },
        {
            "targets": [
                {
                    "targetId": "41aef018-517b-4184-b8d0-5adf47282a7a",
                    "connectionId": "2c6e4a8b-b124-4270-be05-c32a2456bee9"
                }
            ],
            "sourceId": "d358e142-0dae-4f97-919b-337195af60f7"
        },
        {
            "targets": [
                {
                    "targetId": "d358e142-0dae-4f97-919b-337195af60f7",
                    "connectionId": "10f0ea9c-d772-426b-9ef6-537c1bea8272"
                }
            ],
            "sourceId": "41aef018-517b-4184-b8d0-5adf47282a7a"
        }
    ],
    "userId": "01994f06-dcd6-7a30-8de7-356ee6329445",
    "createdAt": new Date("2025-09-27T01:20:46.109Z"),
    "updatedAt": new Date("2025-09-27T01:20:46.109Z")
}

async function runWorkflow(workflow: Workflow) {
    const nodegraph: NodeGraph = new Map();
    const nodesOutput: NodesOutput = new Map();
    const workflowNodes = workflow.nodes as CustomNode[];
    const nodesToRun = workflowNodes
        .filter(node => node.isPrimaryNode)
        .map(node => node.id);
    let visited = new Set();
    

    buildNodeGraph(workflow.nodes as CustomNode[], workflow.connections as Connections, nodegraph);
    initialiseNodesOutputMap(nodegraph, nodesOutput);

    console.log(nodegraph);
    console.log(nodesOutput);


    const issues: WorkflowIssues = await checkWorkflowIssues(workflow);
    console.log(issues);
    if (issues.nodeIssues.length > 0) {
        return;
    }

    console.log(`Executing Workflow ${workflow.name}`);
    while (nodesToRun.length) {
        try {
            console.log("QUEUE: " + nodesToRun);
            const nodeId = nodesToRun.shift();

            const parentIds = Object.entries(nodegraph)
                .filter(([source, targets]) => targets.includes(nodeId))
                .map(([source]) => source.toString());

            if (nodeId !== "a8bee913-2bd3-4ea4-82f1-cf26501b11a3") {
                await runNode(nodeId!, parentIds, workflowNodes, nodesOutput);    
            }

            for (const targetId of nodegraph.get(nodeId!)!) {
                if (!visited.has(targetId)) {
                    nodesToRun.push(targetId);
                }
            }
            visited.add(nodeId);
        } catch (e) {
            console.log(e);
            return;
        }
    }
    console.log(`Finished Executing Workflow ${workflow.name}`)
    
}


async function runNode(nodeId: string, parentIds: string[], workflowNodes: CustomNode[], nodesOutput: NodesOutput) {
    const node: CustomNode = workflowNodes.filter(node => node.id === nodeId)[0];
    
    console.log(`Executing Node ${node.name}`)

    let actionResult;
    try {
        actionResult = await runAction(node);
    } catch (e) {
        throw e;
    }
    if (!actionResult) {
        throw new Error(`Execution of ${node.name} returned null`);
    }
    if (!actionResult.success) {
        throw new Error(`Error while executing ${node.name}: ${actionResult.error}`);
    }
    nodesOutput.set(node.id, actionResult.output!);

    console.log(`Finished Executing Node ${node.name}`)
}


// let workflowQueueWorker = new Worker("workflowQueue", async (job) => {
//     const jobData: Workflow = job.data;
//     await runWorkflow(jobData);
// }, {
//     connection: redisConfig,
//     removeOnComplete: {age: 0}
// });


runWorkflow(workflow);

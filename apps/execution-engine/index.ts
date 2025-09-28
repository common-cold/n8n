import dotenv from "dotenv";
import {join} from "path";

dotenv.config({ path: join(__dirname, "..", "..", ".env") });


import type {Workflow} from "../../packages/db/generated/prisma";
import type {CustomNode, Connections, WorkflowIssues, GmailCredentialsSchema, AgentSubNode} from "@repo/types"
import { buildNodeGraph, checkWorkflowIssues, initialiseNodesOutputMap, type NodeGraph, type NodesOutput } from "./utils";
import { runAction } from "./actions/action-handler";



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

            if (nodeId !== "c3e732d5-9c61-45c0-a45f-1f8bd6e73a06" && 
                nodeId !== "63df5c1d-02c9-47b8-84ac-9332b655658b" &&
                nodeId !== "ecc4f9c0-eb17-4dbf-b151-4151c6162efd"
            ) {
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

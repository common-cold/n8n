import { GmailSendEmailSchema, TelegramSendMessageSchema, type Connections, type CustomNode, type NodeIssue, type NodeType, type TelegramSendMessageParamaters, type WorkflowIssues } from "@repo/types";
import type { Workflow } from "../../packages/db/generated/prisma";
import dotenv from "dotenv";
import {join} from "path";


dotenv.config({ path: join(__dirname, "..", "..", ".env") });


export type NodeGraph = Map<string, Array<string>>;

export type Output = {
    output: {} | null
};

export type NodesOutput = Map<string, Output>;


export function buildNodeGraph(nodes: CustomNode[], connections: Connections, nodegraph: NodeGraph) {
    for (const connection of connections) {
        const childNodes = nodegraph.get(connection.sourceId) ?? [];
        for (const target of connection.targets) {
            childNodes.push(target.targetId);
        }
        nodegraph.set(connection.sourceId, childNodes);
    }
    for (const node of nodes) {
        if (nodegraph.get(node.id) === undefined) {
            nodegraph.set(node.id, []);
        }
    }
}

export function initialiseNodesOutputMap(nodegraph: NodeGraph, nodesOutput: NodesOutput) {
    for (const key of nodegraph.keys()) {
        nodesOutput.set(key, {output: null});
    }

    console.log(nodesOutput);
}

export function checkWorkflowIssues(workflow: Workflow) {
    let workflowIssues: WorkflowIssues = {
        workflowName: workflow.name,
        nodeIssues: []
    };
    for (const node of workflow.nodes as CustomNode[]) {
        const credentialStatus = checkCredentials(workflow.userId, node.type!);
        if (!credentialStatus.ok) {
            const credentialIssue: NodeIssue = {
                nodeName: node.name,
                issue: credentialStatus.issue!
            }
            workflowIssues.nodeIssues.push(credentialIssue);
        }
        let res;
        try {
            
            if (node.type === "telegram.sendMessage") {
                res = TelegramSendMessageSchema.safeParse(node.parameters);
            } else if (node.type === "gmail.sendMail") {
                res = GmailSendEmailSchema.safeParse(node.parameters);
            }
            if (!res!.success) {
                for (const issue of res!.error.issues) {
                    const parameterIssue: NodeIssue = {
                        nodeName: node.name,
                        issue: `${String(issue.path[0])}: ${issue.message}`
                    }
                    workflowIssues.nodeIssues.push(parameterIssue);
                }
            }
        } catch (e) {
            const parameterIssue: NodeIssue = {
                nodeName: node.name,
                issue: JSON.stringify(e)
            }
            workflowIssues.nodeIssues.push(parameterIssue);
        }
    }
    return workflowIssues;
}


function checkCredentials(userId: string, nodeType: NodeType): {
    ok: boolean,
    issue?: string
} {
    return {
        ok: true
    };
}

import { AgentParmaterSchemaLimited, GeminiCredentialsSchema, GmailCredentialsSchema, GmailSendEmailSchema, LLMParameterSchema, TelegramCredentialSchema, TelegramSendMessageSchema, ToolParameterSchema, type AgentParameters, type AgentSubNode, type Connections, type CredentialType, type CustomNode, type NodeCredentials, type NodeIssue, type NodeType, type TelegramSendMessageParamaters, type WorkflowIssues } from "@repo/types";
import type { Workflow } from "../../packages/db/generated/prisma";
import dotenv from "dotenv";
import {join} from "path";
import { prisma } from "@repo/db/client";
import { decryptData } from "@repo/common-utils";
import { fa, tr } from "zod/locales";


export type NodeGraph = Map<string, Array<string>>;

export type Output = { 
    [key: string]: any
}

export type NodesOutput = Map<string, Output>;


export function buildNodeGraph(nodes: CustomNode[], connections: Connections, nodegraph: NodeGraph) {
    for (const connection of connections) {
        const childNodes = nodegraph.get(connection.sourceId) ?? [];
        for (const target of connection.targets) {
            if (!target.isAgentConnection) {
                childNodes.push(target.targetId);
            }
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
}

export async function checkWorkflowIssues(workflow: Workflow) {
    let workflowIssues: WorkflowIssues = {
        workflowName: workflow.name,
        nodeIssues: []
    };

    const flatListResponse = flattenedNodeList(workflow.nodes as CustomNode[]);
    if (!flatListResponse.ok) {
        workflowIssues.nodeIssues.push(...flatListResponse.issueArray!);
        return workflowIssues;
    }

    for (const node of flatListResponse.flastList as (CustomNode | AgentSubNode)[]) {
        let credentialStatus;

        if (node.type !== "agent" && node.type !== "agent.tool.code") {
            credentialStatus = await checkCredentials(node.credentialId);
        }
        if (credentialStatus && !credentialStatus.ok) {
            for (const issue of credentialStatus.issueArray!) {
                const credentialIssue: NodeIssue = {
                    nodeName: node.name,
                    issue: issue
                }
                workflowIssues.nodeIssues.push(credentialIssue);
            }
        }
        let res;
        try {
            if (!node.type) {
                continue;
            }
            if (node.type === "telegram.sendMessage") {
                res = TelegramSendMessageSchema.safeParse(node.parameters);
            } else if (node.type === "gmail.sendMail") {
                res = GmailSendEmailSchema.safeParse(node.parameters);
            } else if (node.type === "agent") {
                let param = node.parameters as AgentParameters;
                res = AgentParmaterSchemaLimited.safeParse({prompt: param.prompt});
            } else if (node.type === "agent.llm.geminichat") {
                res = LLMParameterSchema.safeParse(node.parameters);
            } else if (node.type === "agent.tool.code") {
                res = ToolParameterSchema.safeParse(node.parameters);
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


async function checkCredentials(credentialId: string | undefined): Promise<{
    ok: boolean,
    issueArray?: string[]
}> {
    try {
        if (!credentialId) {
            return {
                ok: false,
                issueArray: ["Credential Id is Empty"]
            }
        }
        const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
        const issueArray: string[] = [];
        const credentialDb = await prisma.credential.findFirst({
            where: {
                id: credentialId
            }
        });
        if (!credentialDb) {
            return {
                ok: false,
                issueArray: ["Credential Does Not Exist"]
            }
        }
        const credentialData: NodeCredentials = JSON.parse(decryptData(credentialDb.data, ENCRYPTION_KEY!));
        const credentialType: CredentialType = credentialDb.type as CredentialType;
        let res;
        if (credentialType === "telegram") {
            res = TelegramCredentialSchema.safeParse(credentialData);
        } else if (credentialType === "gmail") {
            res = GmailCredentialsSchema.safeParse(credentialData);
        } else if (credentialType === "gemini") {
            res = GeminiCredentialsSchema.safeParse(credentialData);
        }
        if (!res!.success) {
            for (const issue of res!.error.issues) {
                issueArray.push(`${String(issue.path[0])}: ${issue.message}`);
            }
        }
        let isSuccess = issueArray.length === 0 ? true : false;
        return {
            ok: isSuccess,
            issueArray: issueArray
        } 
    } catch (e) {
        return {
            ok: false,
            issueArray: [JSON.stringify(e)]
        }
    }
}

function flattenedNodeList(nodes: CustomNode[]): {
    ok: boolean,
    flastList: (CustomNode | AgentSubNode)[],
    issueArray?: NodeIssue[]
} {
    let flatList: (CustomNode | AgentSubNode)[] = [];
    let issues: NodeIssue[] = [];
    for (const node of nodes) {
        if (node.type === "agent") {
            if (!node.parameters) {
                issues.push({
                    nodeName: node.name,
                    issue: "Empty Parameters"
                });
                continue;
            } 
            const param = node.parameters as AgentParameters;
            const llmNodes = param.llm;
            if (llmNodes.length > 0) {
                llmNodes.forEach(llmNode => {
                    flatList.push(llmNode);
                })
            } else {
                 issues.push({
                    nodeName: node.name,
                    issue: "Empty LLM Nodes"
                });
            }
            const toolNodes = param.tools;
            if (toolNodes.length > 0) {
                toolNodes.forEach(toolNode => {
                    flatList.push(toolNode);
                })
            }
        }
        flatList.push(node);
    }

    if (issues.length > 0) {
        return {
            ok: false,
            flastList: [],
            issueArray: issues
        }
    } else {
        return {
            ok: true,
            flastList: flatList,
            issueArray: []
        }
    }
}

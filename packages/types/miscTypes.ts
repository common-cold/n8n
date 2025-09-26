import type { Credential } from "../db/generated/prisma"
import type { Connections, CustomNode } from "./dbTypes"

export type UpsertWorkFlow = {
    name: string,
    nodes: CustomNode[],
    connections: Connections,
    userId: string
}

export type GetWorkFlow = {
    userId: string
}

export type GetNodeType = {
    name: string,
    description: string,
    url: string
}

export type PostCredential = Omit<Credential, 'id'| 'updatedAt'| 'createdAt'>;

export type NodeIssue = {
    nodeName: string,
    issue: string
}

export type WorkflowIssues = {
    workflowName: string,
    nodeIssues: NodeIssue[]    
}

export type NodeExecutionResult = {
    success: boolean,
    output?: { 
        [key: string]: any
    },
    error?: {
        description: string
    }
}


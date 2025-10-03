import type { Credential, Workflow } from "../db/generated/prisma"
import type { Connections, CustomNode } from "./dbTypes"

export type QueueData = Omit<Workflow, 'userId' | 'createdAt' | 'updatedAt' | 'user'>;

export type SignupReqBody = {
    email: string,
    password: string,
    firstName: string,
    lastName: string
}

export type SignInReqBody = Omit<SignupReqBody, 'firstName' | 'lastName'>;

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

export type GetTriggerType = GetNodeType;

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

export type MessageType = "LOG" | "OUTPUT_UPDATE" | "STATUS";

export type PubSubToWebSocketMessage = {
    id: string,
    success: boolean,
    type: MessageType
    data: string,
}

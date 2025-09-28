import type { keyof } from "zod"

export type TargetInfo = {
    targetId: string,
    connectionId: string,
    isAgentConnection: boolean,
    sourceHandleId: string | null
}

export type Targets = Array<TargetInfo>

export type SourceInfo = {
    sourceId: string,
    targets: Targets,
}

export type Connections = Array<SourceInfo>

export type AgentLLMType = "agent.llm.geminichat";
export type AgentToolType = "agent.tool.code";

export type AgentSubNodeType = AgentLLMType | AgentToolType;

export type BasicNodeType = "telegram.sendMessage" | "gmail.sendMail" | "agent";

export type NodeType = BasicNodeType | AgentSubNodeType

//only used in api call for getting nodetypes from db
export type ApiParamNodeType = "basic" | "llm" | "tool"

export type CredentialType = "telegram" | "gmail" | "gemini"


export type CustomNode = {
    id: string,
    name: string,
    type: NodeType,
    parameters?: NodeParameter,
    credentialId?: string,
    isPrimaryNode: boolean,
    position: {
        x: number,
        y: number
    }
}

export type AgentSubNode = Omit<CustomNode, 'isPrimaryNode'> & {
    parentId: string
}


export type TelegramSendMessageParamaters = {
    chatId: string,
    message: string
}

export type GmailSendMailParamaters = {
    to: string,
    subject: string,
    emailType: string,
    message: string
}

export type AgentParameters = {
    llm: AgentSubNode[],
    tools: AgentSubNode[],
    prompt?: string
}

export type FrontendAgentParameters = Omit<AgentParameters, 'llm' | 'tools'>;

export type LLMParameters = {
    modelName: string
}

export type ToolParameters = {
    name: string,
    description: string,
    jsCode: string,
    inputSchema: {
        [key: string]: string | number | boolean | null | undefined
    }
}

export type NodeParameter = TelegramSendMessageParamaters | GmailSendMailParamaters | AgentParameters | LLMParameters | ToolParameters

export type TelegramCredentials = {
    accessToken: string,
    baseurl: string
}

export type GmailCredentials = {
    oAuthRedirectUrl: string,
    clientId: string,
    clientSecret: string
    refreshToken?: string,
    expiresIn?: number
}

export type GeminiCredentials = {
    host: string,
    apiKey: string
}

export type NodeCredentials = TelegramCredentials | GmailCredentials | GeminiCredentials



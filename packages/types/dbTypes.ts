export type TargetInfo = {
    targetId: string,
    connectionId: string,
}

export type Targets = Array<TargetInfo>

export type SourceInfo = {
    sourceId: string,
    targets: Targets
}

export type Connections = Array<SourceInfo>

export type NodeType = "telegram.sendMessage" | "gmail.sendMail" 
export type CredentialType = "telegram" | "gmail"


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

export type NodeParameter = TelegramSendMessageParamaters | GmailSendMailParamaters

export type TelegramCredentials = {
    accessToken: string,
    baseurl: string
}

export type GmailCredentials = {
    oAuthRedirectUrl: string,
    clientId: string,
    clientSecret: string
    refreshToken?: string,
    expiresIn: number
}

export type NodeCredentials = TelegramCredentials | GmailCredentials



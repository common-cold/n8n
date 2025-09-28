import { z } from "zod";

export const TelegramSendMessageSchema = z.object({
    chatId: z.string(),
    message: z.string()
});

export const GmailSendEmailSchema = z.object({
    to: z.email(),
    subject: z.string(),
    emailType: z.string(),
    message: z.string()
});

export const AgentParmaterSchemaLimited = z.object({
    prompt: z.string()
})

export const LLMParameterSchema = z.object({
    modelName: z.string()
})

export const ToolParameterSchema = z.object({
    name: z.string(),
    description: z.string(),
    jsCode: z.string(),
    inputSchema: z.record(
        z.string(),
        z.union([
            z.string(),
            z.number(),
            z.boolean(),
            z.null(),
            z.undefined(),
        ])
    )
});

export const TelegramCredentialSchema = z.object({
    accessToken: z.string(),
    baseurl: z.string()
});

export const GmailCredentialsSchema = z.object({
    oAuthRedirectUrl: z.string(), 
    clientId: z.string(), 
    clientSecret: z.string(), 
    refreshToken: z.string(),
    expiresIn: z.number()
});

export const GeminiCredentialsSchema = z.object({
    host: z.string(),
    apiKey: z.string()
});
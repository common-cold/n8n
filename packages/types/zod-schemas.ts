import { z } from "zod";

export const TelegramSendMessageSchema = z.object({
    chatId: z.string().min(1),
    message: z.string().min(1)
});

export const GmailSendEmailSchema = z.object({
    to: z.email().min(1),
    subject: z.string().min(1),
    emailType: z.string().min(1),
    message: z.string().min(1)
});

export const AgentParmaterSchemaLimited = z.object({
    prompt: z.string().min(1)
})

export const LLMParameterSchema = z.object({
    modelName: z.string()
})

export const ToolParameterSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    jsCode: z.string().min(1),
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
    accessToken: z.string().min(1),
    baseurl: z.string().min(1)
});

export const GmailCredentialsSchema = z.object({
    oAuthRedirectUrl: z.string().min(1),
    clientId: z.string().min(1), 
    clientSecret: z.string().min(1), 
    refreshToken: z.string().min(1),
    expiresIn: z.number()
});

export const GeminiCredentialsSchema = z.object({
    host: z.string().min(1),
    apiKey: z.string().min(1)
});
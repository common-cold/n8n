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
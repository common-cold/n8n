import { z } from "zod";

export const TelegramSendMessageSchema = z.object({
    chatId: z.number(),
    message: z.string()
});

export const GmailSendEmailSchema = z.object({
    to: z.email(),
    subject: z.string(),
    emailType: z.string(),
    message: z.string()
});
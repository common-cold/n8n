import type { NodeExecutionResult, TelegramCredentials, TelegramSendMessageParamaters } from "@repo/types";
import { TelegramBot } from "typescript-telegram-bot-api";
import {prisma} from "@repo/db/client";
import { decryptData } from "@repo/common-utils";


export async function runSendTelegramMessage(credentialId: string , parameter: TelegramSendMessageParamaters): Promise<NodeExecutionResult> {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    console.log(ENCRYPTION_KEY);
    try {
        const credentialEntity = await prisma.credential.findFirst({
            where: {
                id: credentialId
            }
        });

        if (!credentialEntity) {
            return {
                success: false,
                error: {
                    description: "Credentials does not exist"
                }
            };
        }

        const credentialString = decryptData(credentialEntity.data, ENCRYPTION_KEY!);
        const telegramCredential: TelegramCredentials = JSON.parse(credentialString);

        const bot = new TelegramBot({botToken: telegramCredential.accessToken});

        await bot.sendMessage({chat_id: parameter.chatId, text: parameter.message});

        return {
            success: true
        }
    } catch (e) {
        if (TelegramBot.isTelegramError(e)) {
            return {
                success: false,
                error: {
                    description: e.response.description
                }
            }
        } else if (e instanceof Error) {
            return {
                success: false,
                error: {
                    description: e.message
                }
            };
        } else {
            return {
                success: false,
                error: {
                    description: e as string
                }
            };
        }
    }
}
// console.log(await runSendTelegramMessage("01996e08-eedf-7023-8015-d43a92d9dcfc", {
//       "chatId": "6679087141",
//       "message": "Hello bro"
//     }));




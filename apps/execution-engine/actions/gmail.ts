import { prisma } from "@repo/db/client";
import type { GmailCredentials, GmailSendMailParamaters, NodeExecutionResult } from "@repo/types";
import nodemailer from "nodemailer";
import { decryptData } from  "@repo/common-utils";


export async function runSendGmailMail(credentialId: string , parameter: GmailSendMailParamaters): Promise<NodeExecutionResult> {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
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
        const gmailCredential: GmailCredentials = JSON.parse(credentialString);


        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: "prajjwalkohli@gmail.com", //TODO: fix this
                clientId: gmailCredential.clientId,
                clientSecret: gmailCredential.clientSecret,
                refreshToken: gmailCredential.refreshToken
            }
        });

        const info = await transporter.sendMail({
            from: "prajjwalkohli@gmail.com",
            to: parameter.to,
            subject: parameter.subject,
            text: parameter.message,
        });

        return {
            success: true,
            output: info
        };
    } catch (e) {
        console.log(e);
        return {
            success: false,
            error: {
                description: e as string
            }
        };
    }
}




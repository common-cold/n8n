import { prisma } from "@repo/db/client";
import type { GmailCredentials, GmailSendMailParamaters, NodeExecutionResult } from "@repo/types";
import nodemailer from "nodemailer";
import { decryptData } from  "@repo/common-utils";


export async function runSendGmailMail(credentialId: string , parameter: GmailSendMailParamaters): Promise<NodeExecutionResult> {
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
        console.log(credentialEntity);
        const credentialString = decryptData(credentialEntity.data, ENCRYPTION_KEY!);
        const gmailCredential: GmailCredentials = JSON.parse(credentialString);
        console.log(gmailCredential);

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: "prajjwalkohli@gmail.com", //TODO: fix this
                clientId: gmailCredential.clientId,
                clientSecret: gmailCredential.clientSecret,
                accessToken: gmailCredential.accessToken
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
            output: {
                info: JSON.stringify(info)
            }
        };
    } catch (e) {
        return {
            success: false,
            error: {
                description: e as string
            }
        };
    }
}

console.log(await runSendGmailMail("019987c1-7a45-7042-8422-2b03b8c65063", {
    "to": "prajjwalk@iitbhilai.ac.in",
    "message": "good morning",
    "subject": "Hello",
    "emailType": "HTTP"
}));


import type { CustomNode, GmailSendMailParamaters, NodeExecutionResult, NodeParameter, NodeType, TelegramSendMessageParamaters } from "@repo/types";
import { runSendTelegramMessage } from "./telegram";
import { runSendGmailMail } from "./gmail";

export async function runAction(node: CustomNode) {
    const nodeType: NodeType = node.type;
    const nodeParameters: NodeParameter = node.parameters!;
    const nodeCredentialId = node.credentialId!;

    let actionResult: NodeExecutionResult;
    if (nodeType === "telegram.sendMessage") {
        actionResult = await runSendTelegramMessage(nodeCredentialId, nodeParameters as TelegramSendMessageParamaters);
    } else if (nodeType === "gmail.sendMail") {
        actionResult = await runSendGmailMail(nodeCredentialId, nodeParameters as GmailSendMailParamaters);
    } else {
        return null;
    }
    return actionResult;

}
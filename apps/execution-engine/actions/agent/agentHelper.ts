import { decryptData } from "@repo/common-utils";
import { prisma } from "@repo/db/client";
import type { AgentParameters, CustomNode, GeminiCredentials, GmailCredentials, LLMParameters, NodeExecutionResult, ToolParameters } from "@repo/types";
import z from "zod";
import { runGeminiAgent } from "./gemini-agent";

export type ToolMetadata = {
    function: (...args: any[]) => any,
    name: string,
    description: string,
    inputSchema: z.ZodObject
}

type ZodInnerSchema = {
    [key: string] : z.ZodType
}

export function procesToolMetadata(
    functionString: string, 
    description: string, 
    name: string, 
    inputSchema: {
        [key: string] : any
    }) {
        //get fucntion name
        const funcName = retrieveFunctionName(functionString);
        
        //get input zod schema
        let zodInnerSchema: ZodInnerSchema = {};
        
        Object.entries(inputSchema).forEach(([key, value]) => {
            if (value === "string") {
                zodInnerSchema[key] = z.string();
            } else if (value === "number") {
                zodInnerSchema[key] = z.number();
            } else if (value === "boolean") {
                zodInnerSchema[key] = z.boolean();
            }
        });
        const zodObject = z.object(zodInnerSchema);
        
        let toolMetadata: ToolMetadata | undefined;
        
        //populate toolMetadata
        eval(`
            ${functionString}
            
            toolMetadata = {
                function: ${funcName},
                description: description,
                name: name,
                inputSchema: zodObject
            };
        `);
        return toolMetadata!;
        
}

function retrieveFunctionName(functionString: string) {
    let result;
    let funcStr = functionString.trimStart().trimEnd();
    let items = funcStr.split(/\s+/);
    const index = (items.findIndex(val => val === "function"));
    const funcName = items[index+1];
    if (funcName.includes("(")) {
        result = funcName.split("(")[0];
    } else {
        result = funcName;
    }
    return result;
}


export async function runAgent(node: CustomNode): Promise<NodeExecutionResult> {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    const agentParam = node.parameters as AgentParameters;
    const llmNodes = agentParam.llm;
    const toolNodes = agentParam.tools;
    
    try {
        //get toolmetadatalist
        let toolMetadataList: ToolMetadata[] = [];
        for (const tool of toolNodes) {
            const toolParam = tool.parameters as ToolParameters;
            const metadata = procesToolMetadata(toolParam.jsCode, toolParam.description, toolParam.name!, toolParam.inputSchema)
            toolMetadataList.push(metadata);
        }

        //get LLM API Key
        let credentialData: GeminiCredentials;
        
            const credentialDb = await prisma.credential.findFirst({
                where: {
                    id: llmNodes[0].credentialId
                }
            });

            credentialData = JSON.parse(decryptData(credentialDb!.data, ENCRYPTION_KEY!));
    

        const llmParam = llmNodes[0].parameters as LLMParameters;
        
        const response = await runGeminiAgent(agentParam.prompt!, credentialData.apiKey, llmParam.modelName, toolMetadataList);

        return {
            success: true,
            output: response.output
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
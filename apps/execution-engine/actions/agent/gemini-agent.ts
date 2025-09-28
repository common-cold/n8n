import type { AgentParameters, NodeExecutionResult } from "@repo/types";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createAgent, tool, ToolNode } from "langchain";
import type { ToolMetadata } from "./agentHelper";

export async function runGeminiAgent(prompt: string, llmApiKey: string, llmModel: string, toolMetaDataList: ToolMetadata[]): Promise<NodeExecutionResult> {
    try {
        const GEMINI_API_KEY = llmApiKey;
        const MODEL = llmModel;

        const tools = []
        for (const toolMetadata of toolMetaDataList) {
            const toolEntry = tool(
                (input) => {
                    const args = toolMetadata.inputSchema.parse(input);
                    return toolMetadata.function(...Object.values(args));
                },
                {
                    name: toolMetadata.name,
                    description: toolMetadata.description,
                    schema: toolMetadata.inputSchema
                }
            );
            tools.push(toolEntry);
        }

        const toolNode = new ToolNode(tools, {
            name: "tools",
            tags: ["tool-execution"],
            handleToolErrors: true
        })


        const geminiModel = new ChatGoogleGenerativeAI({
            apiKey: GEMINI_API_KEY,
            model: MODEL
        })

        const agent = createAgent({
            llm: geminiModel,
            tools: toolNode
        });

        const result = await agent.invoke({
            messages: [{
                role: "human",
                content: prompt
            }]
        });

        const output = result.messages[result.messages.length - 1].content;
        console.log(output);

        return {
            success: true,
            output: {
                output: output
            }
        };

    } catch (e) {
        console.log(e);
        throw(e)
    }
}
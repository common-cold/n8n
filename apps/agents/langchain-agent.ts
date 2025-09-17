import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createAgent, tool, ToolNode } from "langchain";
import z from "zod";

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const MODEL = 'gemini-2.0-flash';

function calculateSum(a: number, b: number) {
    return `Sum is ${a+b}`;
}

function multiplyBynumber(a: number, b: number) {
    return `After multiplying by ${b} the result is ${a * b}`
}

function raiseToThePowerOfNumber(a: number, b: number) {
    return `After raising to the power of ${b} the result is ${Math.pow(a, b)}`
}

const inputSchema = z.object({
    a: z.number(),
    b: z.number()
});


const sum = tool(
    (input) => {
        const {a, b} = inputSchema.parse(input);
        const result = calculateSum(a, b);
        return result;
    },
    {
        name: "sum",
        description: "This tool is used to find sum of two numbers",
        schema: inputSchema
    }
);

const product = tool(
    (input) => {
        const {a, b} = inputSchema.parse(input);
        const result = multiplyBynumber(a, b);
        return result;
    },
    {
        name: "multiply",
        description: "This tool is used to find product of two numbers",
        schema: inputSchema
    }
);

const power = tool(
    (input) => {
        const {a, b} = inputSchema.parse(input);
        const result = raiseToThePowerOfNumber(a, b);
        return result;
    },
    {
        name: "power",
        description: "This tool is used to raise number a to some power b",
        schema: inputSchema
    }
);

const toolNode = new ToolNode([sum, product, power], {
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
        content: "First calculate 3 + 4, then multiply the result by 2, then raise it to the power of 2"
    }]
});


const output = result.messages[result.messages.length - 1].content;

console.log(output);

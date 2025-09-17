import { google } from "@ai-sdk/google";
import { generateText, stepCountIs, tool } from "ai";
import z from "zod";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
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

const tools = {
    sum: tool({
        description: "This tool is used to find sum of two numbers",
        inputSchema: z.object({
            a: z.number(),
            b: z.number()
        }),
        execute: async ({a,b}) => {
            const result = calculateSum(a, b);
            return result;
        }
    }),
    multiply: tool({
        description: "This tool is used to find product of two numbers",
        inputSchema: z.object({
            a: z.number(),
            b: z.number()
        }),
        execute: async ({a,b}) => {
            const result = multiplyBynumber(a, b);
            return result;
        }
    }),
    power: tool({
        description: "This tool is used to raise number a to some power b",
        inputSchema: z.object({
            a: z.number(),
            b: z.number()
        }),
        execute: async ({a,b}) => {
            const result = raiseToThePowerOfNumber(a, b);
            return result;
        }
    }),
};

async function processQuery(query: string) {
    try {
        const result = await generateText({
            model: google(MODEL),
            prompt: query,
            tools,
            stopWhen: stepCountIs(5)
        });


        console.log(result.text);


    } catch(e) {
        console.error('Error:', e);
        return null;
    }
}

async function main() {
	await processQuery('First calculate 3 + 4, then multiply the result by 2, then raise it to the power of 2');
}

main();
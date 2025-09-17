import { FunctionResponse, GoogleGenAI, type FunctionDeclaration } from "@google/genai";

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const MODEL = 'gemini-2.0-flash';
const messages = ["Whats the sum of 3 & 4", "Multiply this answer with 2", "Raise this answer to power of 2"]

function calculateSum(a: number, b: number) {
    return `Sum is ${a+b}`;
}

function multiplyBynumber(a: number, b: number) {
    return `After multiplying by ${b} the result is ${a * b}`
}

function raiseToThePowerOfNumber(a: number, b: number) {
    return `After raising to the power of ${b} the result is ${Math.pow(a, b)}`
}

const sumFunctionCall: FunctionDeclaration = {
    name: "sum",
    description: "This tool is used to find sum of two numbers",
    parametersJsonSchema: {
        type: "object",
        properties: {
            a: {
                type: "number"
            },
            b: {
                type: "number"
            }
        },
        required: ['a', 'b']
    }
};

const multiplyFunctionCall: FunctionDeclaration = {
    name: "multiply",
    description: "This tool is used to find product of two numbers",
    parametersJsonSchema: {
        type: "object",
        properties: {
            a: {
                type: "number"
            },
            b: {
                type: "number"
            }
        },
        required: ['a', 'b']
    }
};

const powerFunctionCall: FunctionDeclaration = {
    name: "exponentiation",
    description: "This tool is used to raise number a to some power b",
    parametersJsonSchema: {
        type: "object",
        properties: {
            a: {
                type: "number"
            },
            b: {
                type: "number"
            }
        },
        required: ['a', 'b']
    }
};

const functionCallsArray = [sumFunctionCall, multiplyFunctionCall, powerFunctionCall];

const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

let response = await ai.models.generateContent({
    model: MODEL,
    contents: messages[0],
    config: {
        tools: [{functionDeclarations:[functionCallsArray[0]]}]
    }
});

if (!response) {
    process.exit();
}

let contents = [];
contents.push({
    role: "user",
    parts: [{text: messages[0]}]
});

for (let i=0; i<3; i++) {
    if (response.functionCalls && response.functionCalls.length > 0) {
        let functionResponses = [];
        for (const call of response.functionCalls) {
            let functionResult;
            switch (call.name) {
                case "sum": 
                    functionResult = calculateSum(call.args?.a as number, call.args?.b as number);
                    break;
                case "multiply": 
                    functionResult = multiplyBynumber(call.args?.a as number, call.args?.b as number);
                    break;
                case "exponentiation":
                    functionResult = raiseToThePowerOfNumber(call.args?.a as number, call.args?.b as number);
                    break;        
            }

            functionResponses.push({
                functionResponse: {
                    name: call.name,
                    response: {result: functionResult}
                }
            });
        }

        if (response.candidates == undefined || response.candidates[0].content == undefined) {
            process.exit();
        }
        
        contents.push(response?.candidates[0].content);
        contents.push({
            role: "user",
            parts: functionResponses
        });
        if (i < 2) {
            contents.push({
                role: "user",
                parts: [{text: messages[i+1]}]
            })

            response = await ai.models.generateContent({
                model: MODEL,
                contents: contents,
                config: {
                    tools: [{functionDeclarations: [functionCallsArray[i+1]]}]
                }
            });
        } else {
            response = await ai.models.generateContent({
                model: MODEL,
                contents: contents,
            });
        }
    }
}
console.log(response.text);








// console.log("BEFORE");
//     console.log(JSON.stringify(response));
//     console.log("Text = " + JSON.stringify(response.text));
//     console.log("Data = " + JSON.stringify(response.data));
//     console.log("FunctionCalls = " + JSON.stringify(response.functionCalls));
//     console.log("ExecutableCode = " + JSON.stringify(response.executableCode));
//     console.log("ExecutionResult = " + JSON.stringify(response.codeExecutionResult));
//     console.log("--------------------------------------------------");


//  console.log("AFTER");
//     console.log(JSON.stringify(finalResult));
//     console.log("Text = " + JSON.stringify(finalResult.text));
//     console.log("Data = " + JSON.stringify(finalResult.data));
//     console.log("FunctionCalls = " + JSON.stringify(finalResult.functionCalls));
//     console.log("ExecutableCode = " + JSON.stringify(finalResult.executableCode));
//     console.log("ExecutionResult = " + JSON.stringify(finalResult.codeExecutionResult));
//     console.log("--------------------------------------------------");


// contents: [
//                 {
//                     role: "user",
//                     parts: [{text: "Whats the sum of 3 & 4"}]
//                 },
//                 response?.candidates[0].content,
//                 {
//                     role: "user",
//                     parts: functionResponses
//                 },
//                 {
//                     role: "user",
//                     parts: [{text: "Multiply this answer with 2"}]
//                 }
//             ],
import dotenv from "dotenv";
import {join} from "path";

dotenv.config({ path: join(__dirname, "..", "..", ".env") });


import type {Workflow} from "../../packages/db/generated/prisma";
import type {CustomNode, Connections, WorkflowIssues, GmailCredentialsSchema, AgentSubNode, QueueData} from "@repo/types"
import { buildNodeGraph, checkWorkflowIssues, initialiseNodesOutputMap, publishMessage, type NodeGraph, type NodesOutput } from "./utils";
import {redisConfig} from "@repo/redis";
import { runAction } from "./actions/action-handler";
import { Worker } from "bullmq";
import { CHANNEL_NAME } from "@repo/common-utils";
import { success } from "zod";


// const workflow: QueueData = {
//     "id": "019990e1-0c92-70b1-ba45-2026473684ad",
//     "name": "TestFlow",
//     "nodes": [
//         {
//             "id": "c3e732d5-9c61-45c0-a45f-1f8bd6e73a06",
//             "name": "Node 1",
//             "image": "http",
//             "position": {
//                 "x": 10,
//                 "y": 10
//             },
//             "isPrimaryNode": true,
//             "credentialId": "019988b6-2865-7480-b994-71abd38055d2"
//         },
//         {
//             "id": "15717c7d-6762-4005-89c3-42a138bcd227",
//             "name": "Node-2",
//             "type": "agent",
//             "position": {
//                 "x": 306.1999969482422,
//                 "y": 292.6124992370605
//             },
//             "parameters": {
//                 "llm": [
//                     {
//                         "id": "cb717677-d8de-4de9-9942-767d8b2eeab4",
//                         "name": "Node-2-1",
//                         "type": "agent.llm.geminichat",
//                         "image": "http",
//                         "parentId": "15717c7d-6762-4005-89c3-42a138bcd227",
//                         "position": {
//                             "x": 176.7586266549609,
//                             "y": 500.606802695486
//                         },
//                         "parameters": {
//                             "modelName": "gemini-2.0-flash"
//                         },
//                         "credentialId": "019990b1-ddad-7381-ab45-51c901532999"
//                     }
//                 ],
//                 "tools": [
//                     {
//                         "id": "ae6d33be-4c5e-4749-995b-9c9ade9e64c1",
//                         "name": "Node-2-2",
//                         "type": "agent.tool.code",
//                         "image": "http",
//                         "parentId": "15717c7d-6762-4005-89c3-42a138bcd227",
//                         "position": {
//                             "x": 694.2176785628732,
//                             "y": 464.1660243921117
//                         },
//                         "parameters": {
//                             "name": "Sum",
//                             "jsCode": "function calculateSum(a, b) {\n    return `Sum is ${a+b}`;\n}",
//                             "description": "This tool is used to find sum of two numbers",
//                             "inputSchema": {
//                                 "a": "number",
//                                 "b": "number"
//                             }
//                         }
//                     },
//                     {
//                         "id": "9d8ff90d-1a52-4c42-be23-c1ae8f267769",
//                         "name": "Node-2-3",
//                         "type": "agent.tool.code",
//                         "image": "http",
//                         "parentId": "15717c7d-6762-4005-89c3-42a138bcd227",
//                         "position": {
//                             "x": 470.7142383021786,
//                             "y": 540.6916588291974
//                         },
//                         "parameters": {
//                             "name": "Multiply",
//                             "jsCode": "function multiplyBynumber(a, b) {\n    return `After multiplying by ${b} the result is ${a * b}`\n}",
//                             "description": "This tool is used to find product of two numbers",
//                             "inputSchema": {
//                                 "a": "number",
//                                 "b": "number"
//                             }
//                         }
//                     },
//                     {
//                         "id": "19e4d26d-bd68-4ed0-a6c2-056acbc7d617",
//                         "name": "Node-2-4",
//                         "type": "agent.tool.code",
//                         "image": "http",
//                         "parentId": "15717c7d-6762-4005-89c3-42a138bcd227",
//                         "position": {
//                             "x": 631.0536628370247,
//                             "y": 588.0646706235838
//                         },
//                         "parameters": {
//                             "name": "Power",
//                             "jsCode": "function raiseToThePowerOfNumber(a, b) {\n    return `After raising to the power of ${b} the result is ${Math.pow(a, b)}`\n}",
//                             "description": "This tool is used to raise number a to some power b",
//                             "inputSchema": {
//                                 "a": "number",
//                                 "b": "number"
//                             }
//                         }
//                     }
//                 ],
//                 "prompt": "First calculate 3 + 4, then multiply the result by 2, then raise it to the power of 2"
//             },
//             "isPrimaryNode": false
//         },
//         {
//             "id": "63df5c1d-02c9-47b8-84ac-9332b655658b",
//             "name": "Node-3",
//             "image": "http",
//             "type": "gmail.sendMail",
//             "position": {
//                 "x": 482.1999969482422,
//                 "y": 18.61249923706055
//             },
//             "parameters": {
//                 "to": "denji@chainsawman.com",
//                 "message": "get the fuck out",
//                 "subject": "Reze Danger",
//                 "emailType": "HTTP"
//             },
//             "credentialId": "019988b6-2865-7480-b994-71abd38055d2",
//             "isPrimaryNode": false
//         },
//         {
//             "id": "ecc4f9c0-eb17-4dbf-b151-4151c6162efd",
//             "name": "Node-4",
//             "type": "telegram.sendMessage",
//             "image": "http",
//             "position": {
//                 "x": 827.1999969482422,
//                 "y": 304.6124992370605
//             },
//             "parameters": {
//                 "chatId": "12277666",
//                 "message": "niggggabot"
//             },
//             "credentialId": "019987ea-4cd9-7fe0-9c9c-488fe6d4fd51",
//             "isPrimaryNode": false
//         }
//     ],
//     "connections": [
//         {
//             "targets": [
//                 {
//                     "targetId": "15717c7d-6762-4005-89c3-42a138bcd227",
//                     "connectionId": "a335a4e9-5e3b-46ee-a855-74a80c0ee7d2",
//                     "sourceHandleId": null,
//                     "isAgentConnection": false
//                 },
//                 {
//                     "targetId": "63df5c1d-02c9-47b8-84ac-9332b655658b",
//                     "connectionId": "1045f1bc-1985-4bd3-9398-b9fb7418980a",
//                     "sourceHandleId": null,
//                     "isAgentConnection": false
//                 }
//             ],
//             "sourceId": "c3e732d5-9c61-45c0-a45f-1f8bd6e73a06"
//         },
//         {
//             "targets": [
//                 {
//                     "targetId": "ecc4f9c0-eb17-4dbf-b151-4151c6162efd",
//                     "connectionId": "17922c3e-a847-4d60-9341-aaf274ac4c02",
//                     "sourceHandleId": null,
//                     "isAgentConnection": false
//                 },
//                 {
//                     "targetId": "cb717677-d8de-4de9-9942-767d8b2eeab4",
//                     "connectionId": "24e4e9b5-d99b-44ac-a1cf-3344f92c6cd6",
//                     "sourceHandleId": "llm-handle",
//                     "isAgentConnection": true
//                 },
//                 {
//                     "targetId": "ae6d33be-4c5e-4749-995b-9c9ade9e64c1",
//                     "connectionId": "e0bd6db8-5a2d-46a1-9aa7-801a12be9ac1",
//                     "sourceHandleId": "tool-handle",
//                     "isAgentConnection": true
//                 },
//                 {
//                     "targetId": "9d8ff90d-1a52-4c42-be23-c1ae8f267769",
//                     "connectionId": "88fd8959-3ab3-491e-bff7-28bfe4412daa",
//                     "sourceHandleId": "tool-handle",
//                     "isAgentConnection": true
//                 },
//                 {
//                     "targetId": "19e4d26d-bd68-4ed0-a6c2-056acbc7d617",
//                     "connectionId": "aa375586-87af-4fed-8a85-85731ead9206",
//                     "sourceHandleId": "tool-handle",
//                     "isAgentConnection": true
//                 }
//             ],
//             "sourceId": "15717c7d-6762-4005-89c3-42a138bcd227"
//         }
//     ],
// }

const workflow2: QueueData = {
    "id": "0199971a-37c9-7f33-8f9c-caf6079ad7f6",
    "name": "Perfect Workflow",
    "nodes": [
        {
            "id": "418d1159-3017-48b8-98c0-98a2dd802f97",
            "name": "Node 1",
            "position": {
                "x": 10,
                "y": 10
            },
            "isPrimaryNode": true
        },
        {
            "id": "8bdbd5e2-3a5a-47c1-9c5c-c77c1000514f",
            "name": "Creates an AI Agent",
            "type": "agent",
            "image": "https://img.icons8.com/?size=100&id=37628&format=png&color=FFFFFF",
            "position": {
                "x": 551.1999969482422,
                "y": 72.61249923706055
            },
            "parameters": {
                "llm": [
                    {
                        "id": "0086ec36-6835-439e-9733-c1d99cebf0da",
                        "name": "Chat Model Google Gemini",
                        "type": "agent.llm.geminichat",
                        "image": "https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-1024.png",
                        "parentId": "8bdbd5e2-3a5a-47c1-9c5c-c77c1000514f",
                        "position": {
                            "x": 684.4722256071922,
                            "y": 367.0991203063814
                        },
                        "parameters": {
                            "modelName": "Gemini 2.0 Flash"
                        },
                        "credentialId": "019990b1-ddad-7381-ab45-51c901532999"
                    }
                ],
                "tools": [
                    {
                        "id": "2f203f9f-0ac4-4670-b363-6f21e7a14d04",
                        "name": "Product",
                        "type": "agent.tool.code",
                        "image": "https://img.icons8.com/?size=100&id=16141&format=png&color=FFFFFF",
                        "parentId": "8bdbd5e2-3a5a-47c1-9c5c-c77c1000514f",
                        "position": {
                            "x": 1051.202156797689,
                            "y": 466.4271057031722
                        },
                        "parameters": {
                            "name": "Product",
                            "jsCode": "function multiplyBynumber(a, b) {\n    return `After multiplying by ${b} the result is ${a * b}`\n}",
                            "description": "This tool is used to find product of two numbers",
                            "inputSchema": {
                                "a": "number",
                                "b": "number"
                            }
                        }
                    },
                    {
                        "id": "08d5202f-c7c7-480c-ac51-7abd7ef8bdc3",
                        "name": "Power",
                        "type": "agent.tool.code",
                        "image": "https://img.icons8.com/?size=100&id=16141&format=png&color=FFFFFF",
                        "parentId": "8bdbd5e2-3a5a-47c1-9c5c-c77c1000514f",
                        "position": {
                            "x": 884.2828614969934,
                            "y": 542.2995126580336
                        },
                        "parameters": {
                            "name": "Power",
                            "jsCode": "function raiseToThePowerOfNumber(a, b) {\n    return `After raising to the power of ${b} the result is ${Math.pow(a, b)}`\n}",
                            "description": "This tool is used to raise number a to some power b",
                            "inputSchema": {
                                "a": "number",
                                "b": "number"
                            }
                        }
                    },
                    {
                        "id": "59c9a38a-92ba-465a-b93e-d64160913758",
                        "name": "Sum",
                        "type": "agent.tool.code",
                        "image": "https://img.icons8.com/?size=100&id=16141&format=png&color=FFFFFF",
                        "parentId": "8bdbd5e2-3a5a-47c1-9c5c-c77c1000514f",
                        "position": {
                            "x": 1137.696700726231,
                            "y": 334.4091176017134
                        },
                        "parameters": {
                            "name": "Sum",
                            "jsCode": "function calculateSum(a, b) {\n    return `Sum is ${a+b}`;\n}\n",
                            "description": "This tool is used to find sum of two numbers",
                            "inputSchema": {
                                "a": "number",
                                "b": "number"
                            }
                        }
                    }
                ],
                "prompt": "First calculate 3 + 4, then multiply the result by 2, then raise it to the power of 2"
            },
            "isPrimaryNode": false
        },
        {
            "id": "0c170cae-20ad-41af-b4a8-3aa1d049eeb2",
            "name": "Sends a Telegram Message",
            "type": "telegram.sendMessage",
            "image": "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
            "position": {
                "x": 279.7879916067649,
                "y": 247.0124565794282
            },
            "parameters": {
                "chatId": "6679087141",
                "message": "Tester messager"
            },
            "credentialId": "019987ea-4cd9-7fe0-9c9c-488fe6d4fd51",
            "isPrimaryNode": false
        },
        {
            "id": "0a3bdf67-e11c-472d-b63e-24dfb28cd198",
            "name": "Sends an email",
            "type": "gmail.sendMail",
            "image": "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
            "position": {
                "x": 1070.983074552295,
                "y": 97.6016437381283
            },
            "parameters": {
                "to": "prajjwalk@iitbhilai.ac.in",
                "message": "Messager",
                "subject": "Teseter",
                "emailType": "HTTP"
            },
            "credentialId": "019988b6-2865-7480-b994-71abd38055d2",
            "isPrimaryNode": false
        }
    ],
    "connections": [
        {
            "targets": [
                {
                    "targetId": "8bdbd5e2-3a5a-47c1-9c5c-c77c1000514f",
                    "connectionId": "f2321f31-28d4-4cae-8360-031485559f93",
                    "sourceHandleId": null,
                    "isAgentConnection": false
                },
                {
                    "targetId": "0c170cae-20ad-41af-b4a8-3aa1d049eeb2",
                    "connectionId": "bb517478-0b5b-46b0-902a-5db3e3ca5885",
                    "sourceHandleId": null,
                    "isAgentConnection": false
                }
            ],
            "sourceId": "418d1159-3017-48b8-98c0-98a2dd802f97"
        },
        {
            "targets": [
                {
                    "targetId": "0a3bdf67-e11c-472d-b63e-24dfb28cd198",
                    "connectionId": "077729e6-444d-49bd-8169-b49db821febc",
                    "sourceHandleId": null,
                    "isAgentConnection": false
                },
                {
                    "targetId": "0086ec36-6835-439e-9733-c1d99cebf0da",
                    "connectionId": "bd7b1664-c28b-4f76-bce1-b880cc1a2fd7",
                    "sourceHandleId": "llm-handle",
                    "isAgentConnection": true
                },
                {
                    "targetId": "2f203f9f-0ac4-4670-b363-6f21e7a14d04",
                    "connectionId": "36153af3-1fb9-4347-91ce-e40e42d3b5de",
                    "sourceHandleId": "tool-handle",
                    "isAgentConnection": true
                },
                {
                    "targetId": "08d5202f-c7c7-480c-ac51-7abd7ef8bdc3",
                    "connectionId": "72132224-5e41-42ef-8aca-7a93400b70ce",
                    "sourceHandleId": "tool-handle",
                    "isAgentConnection": true
                },
                {
                    "targetId": "59c9a38a-92ba-465a-b93e-d64160913758",
                    "connectionId": "f190deb4-5b29-45f3-8dfe-f298efec4e6c",
                    "sourceHandleId": "tool-handle",
                    "isAgentConnection": true
                }
            ],
            "sourceId": "8bdbd5e2-3a5a-47c1-9c5c-c77c1000514f"
        }
    ]
}

async function runWorkflow(workflow: QueueData) {
    const nodegraph: NodeGraph = new Map();
    const nodesOutput: NodesOutput = new Map();
    const workflowNodes = workflow.nodes as CustomNode[];
    const nodesToRun = workflowNodes
        .filter(node => node.isPrimaryNode)
        .map(node => node.id);
    let visited = new Set();
    

    buildNodeGraph(workflow.nodes as CustomNode[], workflow.connections as Connections, nodegraph);
    initialiseNodesOutputMap(nodegraph, nodesOutput);
    

    console.log(nodegraph);
    console.log(nodesOutput);
    console.log(nodesToRun);

    try {
        const issues: WorkflowIssues = await checkWorkflowIssues(workflow);
        console.log(issues);
        if (issues.nodeIssues.length > 0) {
            await publishMessage(workflow.id, false, "LOG", JSON.stringify(issues));
            return;
        }

        console.log(`Executing Workflow ${workflow.name}`);
        while (nodesToRun.length) {
            console.log("QUEUE: "     + nodesToRun);
            const nodeId = nodesToRun.shift();

            const parentIds = Object.entries(nodegraph)
                .filter(([source, targets]) => targets.includes(nodeId))
                .map(([source]) => source.toString());

            const node: CustomNode = workflowNodes.filter(node => node.id === nodeId)[0];
            if (!node.isPrimaryNode) {
                await runNode(node, parentIds, nodesOutput, workflow.id); 
            }

            for (const targetId of nodegraph.get(nodeId!)!) {
                if (!visited.has(targetId)) {
                    nodesToRun.push(targetId);
                }
            }
            visited.add(nodeId);
        }
     } catch (e) {
        console.log(e);
        await publishMessage(workflow.id, false, "LOG", JSON.stringify(e));
        return;
    }    
    console.log(`Finished Executing Workflow ${workflow.name}`)
    await publishMessage(workflow.id, true, "LOG", `Finished Executing Workflow ${workflow.name}`);
    await publishMessage(workflow.id, true, "STATUS", "END");
}


async function runNode(node: CustomNode, parentIds: string[], nodesOutput: NodesOutput, workflowId: string) {
    console.log(`Executing Node ${node.name}`)

    let actionResult;
    try {
        actionResult = await runAction(node);
    } catch (e) {
        throw e;
    }
    if (!actionResult) {
        throw new Error(`Execution of ${node.name} returned null`);
    }
    if (!actionResult.success) {
        throw new Error(`Error while executing ${node.name}: ${actionResult.error}`);
    }
    nodesOutput.set(node.id, actionResult.output!);
    await publishMessage(workflowId, true, "OUTPUT_UPDATE", JSON.stringify(Array.from(nodesOutput.entries())));

    console.log(`Finished Executing Node ${node.name}`)
    await publishMessage(workflowId, true, "LOG", `Finished Executing Node ${node.name}`);
}


let workflowQueueWorker = new Worker("workflowQueue", async (job: any) => {
    const jobData: QueueData = job.data;
    // console.log(jobData);
    await runWorkflow(jobData);
}, {
    connection: redisConfig,
    removeOnComplete: {age: 100}
});


// runWorkflow(workflow2);

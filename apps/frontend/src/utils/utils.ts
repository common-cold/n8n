import type { Edge, Node } from "reactflow";
import type { AgentParameters, AgentSubNode, ApiParamNodeType, Connections, CredentialType, CustomNode, NodeCredentials, PostCredential, SignInReqBody, SignupReqBody, SourceInfo, Targets, UpsertWorkFlow} from "@repo/types";
import axios from "axios";
import { decryptData, encryptData } from "@repo/common-utils";


const USER_ID = "01994f06-dcd6-7a30-8de7-356ee6329445";
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

export function generateUUID() {
    return crypto.randomUUID();
}

export async function signup(body: SignupReqBody) {
    try {
        const response = await axios.post("http://localhost:8080/signup", body);
        return response;
    } catch (e) {
        return null;
    }
}

export async function signin(body: SignInReqBody) {
    try {
        const response = await axios.post("http://localhost:8080/signin", body);
        console.log("UTILS RES: " + response);
        return response;
    } catch (e: any) {
        if (e.response) {
            return e.response; 
        }
        return null;
    }
}

export async function createWorkFlow(name: string , nodes: Node[], edges: Edge[], update: boolean, workflowId: string | null) {
    const parentIdToSubNodeMap: Map<string, AgentSubNode[]> = new Map();

    const nodesObj: CustomNode[] = nodes
        .filter(node => node.type !== "agentSubNode")
        .map(node => {
            return {
                id: node.id,
                name: node.data.label,
                image: node.data.image,
                isPrimaryNode: node.type === "primaryNode",
                position: node.position,
                type: node.data.type,
                ...(node.data.parameters && { parameters: node.data.parameters }),
                ...(node.data.credentialId && { credentialId: node.data.credentialId }),
                ...(node.data.type === "webhook" && {isActive: node.data.isActive})
            }
    });
 
    const agentNodes: AgentSubNode[] = nodes
        .filter(node => node.type === "agentSubNode")
        .map(node => {
            const subNode = {
                id: node.id,
                name: node.data.label,
                image: node.data.image,
                type: node.data.type,
                position: node.position,
                parentId: node.data.parentId,
                ...(node.data.parameters && { parameters: node.data.parameters }),
                ...(node.data.credentialId && { credentialId: node.data.credentialId })
            }
            
            let arr = parentIdToSubNodeMap.get(node.data.parentId) ?? [];
            arr.push(subNode);
            parentIdToSubNodeMap.set(node.data.parentId, arr);
            
            return subNode;
    });

    // console.log("PARENTIDTOSUBNODEMAP: ");
    // parentIdToSubNodeMap.forEach((value, key) => {
    //     console.log(`${key}: ${JSON.stringify(value)}`);
    // });
    // console.log("--------------------------");

    for (const [parentId, subNodes] of parentIdToSubNodeMap) {
        for (const node of nodesObj) {
            if (node.id === parentId) {
                const toolSubNodes = subNodes.filter(n => n.type === "agent.tool.code");
                const llmSubNodes = subNodes.filter(n => n.type === "agent.llm.geminichat");
                if (!node.parameters) {
                    let parameters: AgentParameters = {
                        llm: llmSubNodes,
                        tools: toolSubNodes
                    }
                    node.parameters = parameters;
                } else {
                    node.parameters = {
                        ...node.parameters,
                        llm: llmSubNodes,
                        tools: toolSubNodes
                    }
                }
            }
        }
    }

    const sourceToEdgeMap: Map<string, Edge[]> = new Map();
    for (const edge of edges) {
        if (edge.source === "new") {
            continue;
        }
        let arr = sourceToEdgeMap.get(edge.source) ?? [];
        arr.push(edge);
        sourceToEdgeMap.set(edge.source, arr);
    }

    const connectionsObj: Connections = []
    sourceToEdgeMap.forEach((edgeArray, sourceId) => {
        const targets: Targets = [];
        for (const edge of edgeArray) {
            targets.push({
                targetId: edge.target,
                connectionId: edge.id,
                isAgentConnection: edge.sourceHandle != null ? true : false,
                sourceHandleId: edge.sourceHandle != null ? edge.sourceHandle : null
            });
        }
        const sourceInfo: SourceInfo = {
            sourceId: sourceId,
            targets: targets,
        }
        connectionsObj.push(sourceInfo);
    });

     console.log("------------------------------------------------");
    console.log("RAWWWWWWWWWWWWWWWWWWWWWWWWWWww");
    console.log(nodes);
    console.log(edges);

    console.log("------------------------------------------------");
    console.log("FIIIIIIIIIIIIIIIIIINNNNNNNNNNNAAAAAALLLLLLLLLL");
    console.log(nodesObj);
    console.log(connectionsObj);

    const body: UpsertWorkFlow = {
        name: name,
        nodes: nodesObj,
        connections: connectionsObj,
        userId: USER_ID
    }

    try {
        if (!update) {
            const response = await axios.post("http://localhost:8080/workflow", body, {
                headers: {
                    Authorization: localStorage.getItem("token")
                }
            });
            return response;
        } else {
            const response = await axios.put(`http://localhost:8080/workflow/${workflowId}`, body, {
                headers: {
                    Authorization: localStorage.getItem("token")
                }
            });
            return response;
        }
    } catch (e) {
        return null;
    }
    return null;
}

export async function getAllUserWorkflows() {
    try {
        const response = await axios.get("http://localhost:8080/workflow/partial", {
            headers: {
                Authorization: localStorage.getItem("token")
            }
        });
        return response;
    } catch(e) {
        return null;
    }
}

export async function getWorkflow(workflowId: string) {
    try {
        const response = await axios.get(`http://localhost:8080/workflow/${workflowId}`, {
            headers: {
                Authorization: localStorage.getItem("token")
            }
        });
        return response;
    } catch(e) {
        return null;
    }
}

export async function getAllTriggerTypes() {
    try {
        const response = await axios.get(`http://localhost:8080/trigger-type`);
        return response;
    } catch(e) {
        return null;
    }   
}


export async function getAllNodeTypes(type: ApiParamNodeType) {
    try {
        const response = await axios.get(`http://localhost:8080/node-type/${type}`);
        return response;
    } catch(e) {
        return null;
    }   
}

export async function saveCredential(credentials: NodeCredentials, credentialName: string, credentialType: CredentialType, userId: string) {
    try {
        const stringData = JSON.stringify(credentials);
        const ciphertext = encryptData(stringData, ENCRYPTION_KEY);
        const credentialObj: PostCredential= {
            name: credentialName,
            data: ciphertext,
            type: credentialType,
            userId: userId
        }
        const response = await axios.post("http://localhost:8080/credential", credentialObj, {
            headers: {
                Authorization: localStorage.getItem("token")
            }
        });
        return response;
    } catch (e) {
        return null;
    }
}


export async function getUserCredentialsByType(type: CredentialType | "all") {
    try {
        const response = await axios.get(`http://localhost:8080/credential/${type}`, {
            headers: {
                Authorization: localStorage.getItem("token")
            }
        });
        return response;
    } catch (e) {
        return null;
    }
}

export async function getOAuthUrl(credentialId: string) {
    try {
        const encryptedCredentialId = encryptData(credentialId, ENCRYPTION_KEY);

        const response = await axios.get("http://localhost:8080/oauth/auth", {
            params: {
                state: encodeURIComponent(encryptedCredentialId)
            }
        });

        return response;
    } catch (e) {
        return null;
    }
}


export async function getOAuthStatus(credentialId: string) {
    try {
        const response = await axios.get(`http://localhost:8080/oauth/status/${credentialId}`);
        return response;
    } catch (e) {
        return null;
    }
}

export async function pollForOAuthStatus(credentialId: string) {
    const now = new Date().getTime();
    const threeMins = now +  180000;
    while (now <= threeMins) {
        const res = await getOAuthStatus(credentialId);
        if (res != null && res.data === "true") {
            return true;
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    return false;
}

export async function runWorkflow(workflowId: string) {
    try {
        const response = await axios.post(`http://localhost:8080/run/workflow/${workflowId}`);
        return response;
    } catch (e) {
        return null;
    }
}

export async function saveWebhook(webhookUrl: string) {
    try {
        const response = await axios.post(`http://localhost:8080/webhook`, {
            url: webhookUrl
        });
        return response;
    } catch (e) {
        return null;
    }
}

export async function deleteWebhook(webhookUrl: string) {
    console.log("DELETE UTIL: " + webhookUrl);
    try {
        const response = await axios.delete(`http://localhost:8080/webhook`,  {
            data: { 
                url: webhookUrl 
            }
        });
        return response;
    } catch (e) {
        return null;
    }
}

export function decryptCredentialData(data: string) {
    return JSON.parse(decryptData(data, ENCRYPTION_KEY)) as NodeCredentials;
}
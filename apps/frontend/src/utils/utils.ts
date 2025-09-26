import type { Edge, Node } from "reactflow";
import type { Connections, CredentialType, CustomNode, NodeCredentials, PostCredential, SourceInfo, Targets, UpsertWorkFlow} from "@repo/types";
import axios from "axios";
import { encryptData } from "@repo/common-utils";


const USER_ID = "01994f06-dcd6-7a30-8de7-356ee6329445";
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

export function generateUUID() {
    return crypto.randomUUID();
}

export async function createWorkFlow(name: string , nodes: Node[], edges: Edge[], update: boolean, workflowId: string | null) {
    const nodesObj: CustomNode[] = nodes.map(node => {
        return {
            id: node.id,
            name: node.data.label,
            isPrimaryNode: node.type === "primaryNode",
            position: node.position,
            type: node.data.type,
            ...(node.data.parameters && { parameters: node.data.parameters }),
            ...(node.data.credentialId && { credentialId: node.data.credentialId }),
        }
    });
    
    const sourceToEdgeMap: Map<string, Edge[]> = new Map();
    for (const edge of edges) {
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
            });
        }
        const sourceInfo: SourceInfo = {
            sourceId: sourceId,
            targets: targets
        }
        connectionsObj.push(sourceInfo);
    })

    const body: UpsertWorkFlow = {
        name: name,
        nodes: nodesObj,
        connections: connectionsObj,
        userId: USER_ID
    }

    try {
        if (!update) {
            const response = await axios.post("http://localhost:8080/workflow", body);
            return response;
        } else {
            const response = await axios.put(`http://localhost:8080/workflow/${workflowId}`, body);
            return response;
        }
    } catch (e) {
        return null;
    }
}

export async function getAllUserWorkflows() {
    try {
        const response = await axios.get("http://localhost:8080/workflow/partial");
        return response;
    } catch(e) {
        return null;
    }
}

export async function getWorkflow(workflowId: string) {
    try {
        const response = await axios.get(`http://localhost:8080/workflow/${workflowId}`);
        return response;
    } catch(e) {
        return null;
    }
}

export async function getAllNodeTypes() {
    try {
        const response = await axios.get(`http://localhost:8080/node-type`);
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
        const response = await axios.post("http://localhost:8080/credential", credentialObj);
        return response;
    } catch (e) {
        return null;
    }
}


export async function getUserCredentialsByType(type: CredentialType | "all") {
    try {
        const response = await axios.get(`http://localhost:8080/credential/${type}`);
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
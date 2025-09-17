import type { Edge, Node } from "reactflow";
import type { Connections, CustomNode, GetWorkFlow, NodeType, SourceInfo, Targets, UpsertWorkFlow} from "@repo/types";
import axios from "axios";

const USER_ID = "01994f06-dcd6-7a30-8de7-356ee6329445";

export function generateUUID() {
    return crypto.randomUUID();
}

export async function createWorkFlow(name: string , nodes: Node[], edges: Edge[], update: boolean, workflowId: string | null) {
    const nodesObj: CustomNode[] = nodes.map(node => {
        return {
            id: node.id,
            name: node.data.label,
            type: node.type as NodeType,
            position: node.position
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
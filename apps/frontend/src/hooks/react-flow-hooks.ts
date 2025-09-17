import { addEdge, MarkerType, useReactFlow, type Edge } from "reactflow";
import { generateUUID } from "../utils/utils";



export function useCommonReactFlowFunctions() {
    const { setNodes, getNode, setEdges, getEdges } = useReactFlow();

    const hasOutgoingEdge = (nodeId: string) => {
        const edges = getEdges();
        return edges.some(edge => edge.source === nodeId);
    }


    const createEdge = (sourceId: string, targetId: string) => {
        const edge:Edge = {
            id: generateUUID(),
            source: sourceId,
            target: targetId,
            type: "customEdge",
            markerEnd:{type: MarkerType.ArrowClosed, color: "white"}
        }
        setEdges(prev => addEdge(edge, prev));
    }


    const addNodeAndCreateEdge = (sourceId: string) => {
        const node = getNode(sourceId);
        const targetId = generateUUID();
        setNodes(prev => [
            ...prev, 
            {
                id: targetId, 
                data: {label: "Node-x"}, 
                type: "secondaryNode",
                position: {x: node!.position.x + 300, y: node!.position.y}
            }
        ]);
        createEdge(sourceId, targetId);
    }

    return {hasOutgoingEdge, addNodeAndCreateEdge};
}



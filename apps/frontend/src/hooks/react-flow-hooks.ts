import { addEdge, MarkerType, useReactFlow, type Edge, type Node, type XYPosition } from "reactflow";
import { generateUUID } from "../utils/utils";
import type { CustomNode, FrontendAgentParameters, NodeParameter, NodeType, ToolParameters, TriggerType } from "@repo/types";
import { useAtomValue, useSetAtom } from "jotai";
import {  newNodeMetadataAtom } from "../store/atoms";



export function useCommonReactFlowFunctions() {
    const { setNodes, getNode, getNodes, setEdges, getEdges, screenToFlowPosition } = useReactFlow();
    const newNodeMetadata = useAtomValue(newNodeMetadataAtom);


    const hasOutgoingEdge = (nodeId: string) => {
        const edges = getEdges();
        return edges.some(edge => edge.source === nodeId);
    }


    const createEdge = (sourceId: string, targetId: string, nodeType: NodeType | TriggerType) => {
        let sourceHandle;
        if (nodeType === "agent.llm.geminichat") {
            sourceHandle = "llm-handle"
        } else if (nodeType === "agent.tool.code") {
            sourceHandle = "tool-handle"
        }
        const edge:Edge = {
            id: generateUUID(),
            source: sourceId,
            target: targetId,
            type: "customEdge",
            markerEnd:{type: MarkerType.ArrowClosed, color: "white"},
            ...(sourceHandle && {sourceHandle : sourceHandle})
        }
        setEdges(prev => addEdge(edge, prev));
    }

    const deleteEdge = (sourceId: string, targetId: string) => {
        const edges = getEdges();
        const newEdges = edges.filter(edge => (edge.source != sourceId || edge.target != targetId));
        setEdges(newEdges);
    }


    const addNodeAndCreateEdge = (nodeType: NodeType | TriggerType, nodeImage: string, nodeName: string) => {
        if (!newNodeMetadata) {
            return;
        }
        let type;
        if (nodeType === "manual" || nodeType === "webhook") {
            type = "primaryNode";
        } else if (nodeType === "agent") {
            type = "agentNode"
        } else if (nodeType === "agent.llm.geminichat" || nodeType === "agent.tool.code") {
            type = "agentSubNode"
        } else {
            type = "secondaryNode"
        }
        const position = screenToFlowPosition({x: newNodeMetadata?.x, y: newNodeMetadata?.y})
        const targetId = generateUUID();
        let newNode = {
            id: targetId, 
            data: {
                label: (nodeType === "agent.tool.code" ? "" : nodeName),
                type: nodeType,
                image: nodeImage,
                ...(type === "agentSubNode" && {parentId: newNodeMetadata.sourceNode}),
                ...(nodeType === "webhook" && {isActive: false})
            }, 
            type: type,
            position: (
                type === "agentSubNode" 
                ?
                {x: position.x + 12, y: position.y}
                :
                {x: position.x + 3, y: position.y}
            )
        }
    
        setNodes(prev => [
            ...prev, 
            newNode
        ]);

        createEdge(newNodeMetadata.sourceNode, targetId, nodeType);
    }

    const deleteNodeAndEdge = (nodeToRemoveId: string, parentNodeId: string) => {
        const nodes = getNodes();
        const newNodes = nodes.filter(node => node.id != nodeToRemoveId);
        setNodes(newNodes);
        deleteEdge(parentNodeId, nodeToRemoveId);
    }

    const updateNodeParameters = (nodeId: string, parameters: NodeParameter | FrontendAgentParameters, credentialId: string | null) => {
        const nodes = getNodes();
        const newNodes = nodes.map(node =>
            node.id === nodeId
            ? {
                ...node,
                data: {
                    ...node.data,
                    ...( 'name' in parameters && {label: (parameters as ToolParameters).name}),
                    parameters: parameters,
                    ...(credentialId != null && { credentialId })
                }
            }
            : node
        );
        console.log("NEW NODES: " + JSON.stringify(newNodes));
        setNodes(newNodes);
    }

    const updateNodeData = (nodeId: string, updatedNode: Node) => {
        const nodes = getNodes();
        const newNodes = nodes.map(node =>
            node.id === nodeId
            ? updatedNode
            : node
        );
        console.log("NEW NODES: " + JSON.stringify(newNodes));
        setNodes(newNodes);
    }

    return {hasOutgoingEdge, addNodeAndCreateEdge, deleteNodeAndEdge, updateNodeParameters};

}



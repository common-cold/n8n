import { addEdge, MarkerType, useReactFlow, type Edge, type XYPosition } from "reactflow";
import { generateUUID } from "../utils/utils";
import type { CustomNode, FrontendAgentParameters, NodeParameter, NodeType } from "@repo/types";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {  newNodeMetadataAtom, toggleAtom } from "../store/atoms";



export function useCommonReactFlowFunctions() {
    const { setNodes, getNode, getNodes, setEdges, getEdges, screenToFlowPosition } = useReactFlow();
    const newNodeMetadata = useAtomValue(newNodeMetadataAtom);
    const [toggle ,setToggle] = useAtom(toggleAtom);


    const hasOutgoingEdge = (nodeId: string) => {
        const edges = getEdges();
        return edges.some(edge => edge.source === nodeId);
    }


    const createEdge = (sourceId: string, targetId: string, nodeType: NodeType) => {
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
        setToggle(prev => !prev);
    }

    const deleteEdge = (sourceId: string, targetId: string) => {
        const edges = getEdges();
        const newEdges = edges.filter(edge => (edge.source != sourceId || edge.target != targetId));
        setEdges(newEdges);
        setToggle(prev => !prev);
    }


    const addNodeAndCreateEdge = (nodeType: NodeType) => {
        if (!newNodeMetadata) {
            return;
        }
        let type = "secondaryNode";
        if (nodeType === "agent") {
            type = "agentNode"
        } else if (nodeType === "agent.llm.geminichat" || nodeType === "agent.tool.code") {
            type = "agentSubNode"
        }
        const position = screenToFlowPosition({x: newNodeMetadata?.x, y: newNodeMetadata?.y})
        const targetId = generateUUID();
        let newNode;
        if (type === "agentSubNode") {
            newNode = {
                id: targetId, 
                data: {
                    label: "Node-x",
                    type: nodeType,
                    parentId: newNodeMetadata.sourceNode
                }, 
                type: type,
                position: {x: position.x + 12, y: position.y}
            }
        } else {
            newNode = {
                id: targetId, 
                data: {
                    label: "Node-x",
                    type: nodeType,
                }, 
                type: type,
                position: {x: position.x + 3, y: position.y}
            }
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
                    parameters: parameters,
                    ...(credentialId != null && { credentialId })
                }
            }
            : node
        );
        console.log("NEW NODES: " + JSON.stringify(newNodes));
        setNodes(newNodes);
    }

    return {hasOutgoingEdge, addNodeAndCreateEdge, deleteNodeAndEdge, updateNodeParameters};

}



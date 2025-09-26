import { addEdge, MarkerType, useReactFlow, type Edge, type XYPosition } from "reactflow";
import { generateUUID } from "../utils/utils";
import type { CustomNode, NodeParameter, NodeType } from "@repo/types";
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


    const createEdge = (sourceId: string, targetId: string) => {
        const edge:Edge = {
            id: generateUUID(),
            source: sourceId,
            target: targetId,
            type: "customEdge",
            markerEnd:{type: MarkerType.ArrowClosed, color: "white"}
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
        const position = screenToFlowPosition({x: newNodeMetadata?.x, y: newNodeMetadata?.y})
        const targetId = generateUUID();
        setNodes(prev => [
            ...prev, 
            {
                id: targetId, 
                data: {
                    label: "Node-x",
                    type: nodeType
                }, 
                type: "secondaryNode",
                position: {x: position.x + 3, y: position.y}
            }
        ]);

        createEdge(newNodeMetadata.sourceNode, targetId);
    }

    const deleteNodeAndEdge = (nodeToRemoveId: string, parentNodeId: string) => {
        const nodes = getNodes();
        const newNodes = nodes.filter(node => node.id != nodeToRemoveId);
        setNodes(newNodes);
        deleteEdge(parentNodeId, nodeToRemoveId);
    }

    const updateNodeParameters = (nodeId: string, parameters: NodeParameter, credentialId: string | null) => {
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
        setNodes(newNodes);
    }

    return {hasOutgoingEdge, addNodeAndCreateEdge, deleteNodeAndEdge, updateNodeParameters};

}



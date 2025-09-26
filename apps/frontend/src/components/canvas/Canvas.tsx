import 'reactflow/dist/style.css';
import ReactFlow, { addEdge, Background, Controls, MarkerType, useEdgesState, useNodesState, type Connection, type Edge, type Node } from "reactflow";
import { SecondaryNode } from './SecondaryNode';
import { initialEdges, initialNodes } from './Nodes';
import { CustomEdge } from './CustomEdge';
import { PrimaryNode } from './PrimaryNode';
import { generateUUID, getAllNodeTypes, getWorkflow } from '../../utils/utils';
import { useEffect, useState } from 'react';
import { showErrorToast } from '../WorkflowPage';
import type { Workflow } from '../../../../../packages/db/generated/prisma';
import type { Connections, CustomNode, GetNodeType, NodeType } from '@repo/types';
import { useAtom } from 'jotai';
import { showNodeTypeListAtom } from '../../store/atoms';
import { useCommonReactFlowFunctions } from '../../hooks/react-flow-hooks';



// const initNodes: Node[] = [
//         {
//             id: "1",
//             position: {x: 50, y: 50},
//             data: {
//                 label: "Node 1"
//             }
//         },
//         {
//             id: "2",
//             position: {x: 305, y: 305},
//             data: {
//                 label: "Node 2"
//             }
//         },
//         {
//             id: "3",
//             position: {x: 200, y: 100},
//             data: {
//                 label: "Node 3"
//             }
//         }
//     ];

// const initEdges: Edge[] = [
//     {
//         id: "1",
//         source: "1",
//         target: "2",
//         animated: true
//     },
// ];


const nodeTypes = {
    primaryNode: PrimaryNode,
    secondaryNode: SecondaryNode
}

const edgeTypes = {
    customEdge: CustomEdge
}

export function Canvas({id} : {id: string}) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [showNodeTypeList, setShowNodeTypeList] = useAtom(showNodeTypeListAtom);
    const [nodeTypeList, setNodeTypeList] = useState<GetNodeType[]>([]);
    const [mouseEnterIndex, setMouseEnterIndex] = useState<number | null>(null);
    const {addNodeAndCreateEdge} = useCommonReactFlowFunctions();

    console.log(JSON.stringify(edges));
    console.log(JSON.stringify(nodes));
    console.log("----------------------------------");

    function onConnect(connection: Connection) {
        const edge = {...connection, id: generateUUID(), type: "customEdge", markerEnd:{type: MarkerType.ArrowClosed, color: "white"}}
        setEdges(prev => addEdge(edge, prev));
    }

    function handleEdgeMouseEnter(edge: Edge) {
        setEdges(edges =>
            edges.map(edg => {
                if (edg.id === edge.id) {
                    return {    
                        ...edg,
                        style: {...edg.style, stroke: "#ff6f5c"},
                        markerEnd: {type: MarkerType.ArrowClosed, color: "#ff6f5c"}
                    } as Edge;
                } else {
                    return edg;
                }
            })
        );
    }
    
    function handleEdgeMouseLeave (edge: Edge) {
        setEdges(edges =>
            edges.map(edg => {
                if (edg.id === edge.id) {
                    return {    
                        ...edg,
                        style: {color: "white"},
                        markerEnd: {type: MarkerType.ArrowClosed, color: "white"}
                    } as Edge;
                } else {
                    return edg;
                }
            })
        );
    }

    function evaluateNodesAndEdges(workflow: Workflow) {
        const nodesDb: CustomNode[] = workflow.nodes as CustomNode[];
        let nodes:Node[] = [];
        if (nodesDb.length > 0) {
            nodes = nodesDb.map((nodeDb, index) => {
                return {
                    id: nodeDb.id,
                    data: {
                        label: nodeDb.name,
                        type: nodeDb.type,
                        ...(nodeDb.parameters && {parameters: nodeDb.parameters}),
                        ...(nodeDb.credentialId && {credentialId: nodeDb.credentialId})
                    },
                    type: nodeDb.isPrimaryNode ? "primaryNode" : "secondaryNode",
                    position: {x: nodeDb.position.x , y: nodeDb.position.y },
                    
                } as Node
            });
        }
        const connections: Connections = workflow.connections as Connections;
        let edges: Edge[] = []
        if (connections.length > 0) {
            for (const connection of connections) {
                for (const target of connection.targets) {
                    const edge: Edge = {
                        id: target.connectionId,
                        source: connection.sourceId,
                        target: target.targetId,
                        type: "customEdge", 
                        markerEnd:{type: MarkerType.ArrowClosed, color: "white"}
                    }
                    edges.push(edge);
                }
            }
        }
        setNodes(nodes);
        setEdges(edges);
    }

    async function loadWorkflowData() {
        const response = await getWorkflow(id);
            if (response == null) {
                showErrorToast("Error In Fetching Workflow");
            } else if (response.status === 200) {
                evaluateNodesAndEdges(response.data as Workflow);
            } else {
                showErrorToast("Error In Fetching Workflows");
        }
    }

    async function loadAllNodeTypes() {
        const response = await getAllNodeTypes();
            if (response == null) {
                showErrorToast("Error In Fetching Node Types");
            } else if (response.status === 200) {
                setNodeTypeList(response.data);
            } else {
                showErrorToast("Error In Node Type");
        }
    }

    useEffect(()=> {
        if (id != "new") {
            loadWorkflowData();
        }
        loadAllNodeTypes();

        function handleEscapeKey(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setShowNodeTypeList(false);
            }
        }
        window.addEventListener("keydown", handleEscapeKey);
        return () => removeEventListener("keydown", handleEscapeKey);

    },[id]);

    return <div className="flex-1  borderStyle relative">
        <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onEdgeMouseEnter={(_, edge) => handleEdgeMouseEnter(edge)}
            onEdgeMouseLeave={(_, edge) => handleEdgeMouseLeave(edge)}
        >
            <Background style={{backgroundColor: "#2d2e2e"}}/>
            <Controls/>
        </ReactFlow>
        <NodeTypeList/>
    </div>


    function NodeTypeList() {
    return <div
        className={`absolute top-0 right-0 h-full w-[350px] bg-[#414244] text-white z-50 shadow-lg transform transition-transform duration-200 ${
            showNodeTypeList ? "translate-x-0" : "translate-x-full"
        }`}
        >
        <div className='flex flex-col'>
            <div className='lightGrey px-3 py-5 text-xl font-[Satoshi-Black]'>
                Select a Node
            </div>
            <div className={`flex flex-col`}>
                {
                    nodeTypeList.map((nodeType, index) => {
                        return <div onMouseEnter={() => setMouseEnterIndex(index)}
                            onMouseLeave={() => setMouseEnterIndex(null)}
                            onClick={() => {
                                setShowNodeTypeList(false)
                                addNodeAndCreateEdge(nodeType.name as NodeType)
                            }}
                                key={index} className={`flex justify-start gap-3 px-3 py-5 ${mouseEnterIndex === index ? "bg-[#525456]" : "bg-[#414244]"}`}>
                                <img
                                    className="iconStyle"
                                    src={nodeType.url}
                                />
                                <div className='text-md'>
                                    {nodeType.description}
                                </div>
                        </div>
                    })
                }
            </div>
        </div>
    </div>
}
}


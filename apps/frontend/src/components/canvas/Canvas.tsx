import 'reactflow/dist/style.css';
import ReactFlow, { addEdge, Background, Controls, MarkerType, Panel, useEdgesState, useNodesState, useReactFlow, useStore, type Connection, type Edge, type Node } from "reactflow";
import { SecondaryNode } from './SecondaryNode';
import { initialEdges, initialNodes } from './Nodes';
import { CustomEdge } from './CustomEdge';
import { PrimaryNode } from './PrimaryNode';
import { generateUUID, getAllNodeTypes, getAllTriggerTypes, getWorkflow } from '../../utils/utils';
import { useEffect, useState } from 'react';
import { showErrorToast } from '../WorkflowPage';
import type { Workflow } from '../../../../../packages/db/generated/prisma';
import { type GetTriggerType, type AgentParameters, type ApiParamNodeType, type Connections, type CustomNode, type FrontendAgentParameters, type GetNodeType, type NodeType } from '@repo/types';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { newNodeMetadataAtom, nodeTypeToShow, reloadCanvasToggleAtom, showNodeTypeListAtom, showTriggerTypeListAtom } from '../../store/atoms';
import { useCommonReactFlowFunctions } from '../../hooks/react-flow-hooks';
import { AgentNode } from './AgentNode';
import { AgentSubNode } from './AgentSubNode';
import { Plus } from 'react-bootstrap-icons';
import { shallow } from 'zustand/shallow'



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
    secondaryNode: SecondaryNode,
    agentNode: AgentNode,
    agentSubNode: AgentSubNode
}

const edgeTypes = {
    customEdge: CustomEdge
}

export function Canvas({id} : {id: string}) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [showTriggerTypeList, setshowTriggerTypeList] = useAtom(showTriggerTypeListAtom);
    const [triggerTypeList, setTriggerTypeList] = useState<GetTriggerType[]>([]);
    const [showNodeTypeList, setShowNodeTypeList] = useAtom(showNodeTypeListAtom);
    const [basicNodeTypeList, setBasicNodeTypeList] = useState<GetNodeType[]>([]);
    const [toolNodeTypeList, setToolNodeTypeList] = useState<GetNodeType[]>([]);
    const [LLMNodeTypeList, setLLMNodeTypeList] = useState<GetNodeType[]>([]);
    const [nodeTypeList, setNodeTypeList] = useState<GetNodeType[]>([]);
    const currNodeTypeToShow = useAtomValue(nodeTypeToShow);
    const [mouseEnterIndex, setMouseEnterIndex] = useState<number | null>(null);
    const {addNodeAndCreateEdge} = useCommonReactFlowFunctions();
    const setNewNodeMetadata = useSetAtom(newNodeMetadataAtom);
    const reloadCanvasToggle = useAtomValue(reloadCanvasToggleAtom);

    console.log(JSON.stringify(edges));
    console.log(JSON.stringify(nodes));
    console.log("----------------------------------");
    console.log(currNodeTypeToShow);
    console.log("SHOW TRIGGER: " + showTriggerTypeList);

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
            
            //extract basic nodes
            nodes = nodesDb.map((nodeDb, index) => {
                let nodeType;
                if (nodeDb.type === "agent") {
                    nodeType = "agentNode";
                } else if (nodeDb.isPrimaryNode) {
                    nodeType = "primaryNode";
                } else {
                    nodeType = "secondaryNode";
                }

                let parameters;
                if (nodeDb.parameters) {
                    let p = nodeDb.parameters as AgentParameters;
                    if (nodeDb.type === "agent") {
                        parameters = {
                            prompt: p.prompt ?? ""
                        } as FrontendAgentParameters
                    } else {
                        parameters = nodeDb.parameters
                    }
                }
                console.log("IS ACTIVE: " + nodeDb.isActive);
                return {
                    id: nodeDb.id,
                    data: {
                        label: nodeDb.name,
                        type: nodeDb.type,
                        image: nodeDb.image,
                        ...(nodeDb.parameters && {parameters: parameters}),
                        ...((nodeDb.credentialId) && {credentialId: nodeDb.credentialId}),
                        ...((nodeDb.isActive !== undefined) && {isActive: nodeDb.isActive})
                    },
                    type: nodeType,
                    position: {x: nodeDb.position.x , y: nodeDb.position.y },
                    
                } as Node
            });

            console.log("CANVASSS NODESSSS: " + JSON.stringify(nodesDb));

            //extract agent sub nodes
            nodesDb.map((nodeDb) => {
                if (nodeDb.type == "agent") {
                    let nodeParams = nodeDb.parameters as AgentParameters;
                    if ((nodeParams.llm) && nodeParams.llm.length > 0) {
                        for (const subNode of nodeParams.llm) {
                            nodes.push({
                                id: subNode.id,
                                data: {
                                    label: subNode.name,
                                    image: subNode.image,
                                    type: subNode.type,
                                    parentId: subNode.parentId,
                                    ...(subNode.parameters && {parameters: subNode.parameters}),
                                    ...(subNode.credentialId && {credentialId: subNode.credentialId})
                                },
                                type: "agentSubNode",
                                position: {x: subNode.position.x , y: subNode.position.y },
                            } as Node);
                        }
                    }
                    if ((nodeParams.tools) && nodeParams.tools.length > 0) {
                        for (const subNode of nodeParams.tools) {
                            nodes.push({
                                id: subNode.id,
                                data: {
                                    label: subNode.name,
                                    image: subNode.image,
                                    type: subNode.type,
                                    parentId: subNode.parentId,
                                    ...(subNode.parameters && {parameters: subNode.parameters}),
                                },
                                type: "agentSubNode",
                                position: {x: subNode.position.x , y: subNode.position.y },
                            } as Node);
                        }
                    }
                }
            });
        }

        const connections: Connections = workflow.connections as Connections;
        let edges: Edge[] = []
        if (connections.length > 0) {
            for (const connection of connections) {
                for (const target of connection.targets) {
                    let edge: Edge;
                    if (target.isAgentConnection) {
                        console.log("CAME INSIDE AGENT IF");
                        edge = {
                            id: target.connectionId,
                            sourceHandle: target.sourceHandleId,
                            source: connection.sourceId,
                            target: target.targetId,
                            type: "customEdge", 
                            markerEnd:{type: MarkerType.ArrowClosed, color: "white"}
                        }
                    } else {
                        edge = {
                            id: target.connectionId,
                            source: connection.sourceId,
                            target: target.targetId,
                            type: "customEdge", 
                            markerEnd:{type: MarkerType.ArrowClosed, color: "white"}
                        }
                    }
                    
                    edges.push(edge);
                }
            }
        }

        console.log("EXTRACTED Nodes DB: " + JSON.stringify(nodes));
        console.log("EXTRACTED Connections FROM DB: " + JSON.stringify(edges));
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


    async function loadAllTriggerTypes() {
        const response = await getAllTriggerTypes();
        if (response == null) {
            showErrorToast("Error In Fetching Trigger Types");
        } else if (response.status === 200) {
            setTriggerTypeList(response.data);
        } else {
            showErrorToast("Error In Fetching Trigger Types");
        }
    }


    async function loadAllNodeTypes(type: ApiParamNodeType) {
        const response = await getAllNodeTypes(type);
        if (response == null) {
            showErrorToast("Error In Fetching Node Types");
        } else if (response.status === 200) {
            if (type === "basic") {
                setBasicNodeTypeList(response.data);
            } else if (type === "tool") {
                setToolNodeTypeList(response.data);
            } else if (type === "llm") {
                setLLMNodeTypeList(response.data);
            }
        } else {
            showErrorToast("Error In Fetching Node Types");
        }
    }

    useEffect(()=> {
        loadAllTriggerTypes()
        loadAllNodeTypes("basic");
        loadAllNodeTypes("tool");
        loadAllNodeTypes("llm");

        if (id != "new") {
            loadWorkflowData();
        }

        function handleEscapeKey(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setShowNodeTypeList(false);
            }
        }
        window.addEventListener("keydown", handleEscapeKey);
        return () => removeEventListener("keydown", handleEscapeKey);

    },[id, reloadCanvasToggle]);


    return <div className="flex-1  borderStyle relative">
        <ReactFlow className='relative'
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
        {
            nodes.length == 0 
            &&
            <AddTriggerButton/>
        }
        <NodeTypeList/>
    </div>


    function AddTriggerButton() {
        return <div className="absolute top-[40%] right-[50%] flex flex-col justify-center items-center gap-3">
            <div onClick={(e) => {
                const {clientX, clientY} = e;
                setNewNodeMetadata({x: clientX, y: clientY, sourceNode: id});
                setshowTriggerTypeList(true);
            }} 
                className="flex items-center justify-center w-[130px] h-[120px] bg-[#414244] border-dashed border-2 border-white rounded-[10px]">
                <Plus 
                    className="text-white w-11 h-11"
                />
            </div>
            <div className='nodeName'>
                Add a Trigger
            </div>
        </div>
    }

    function NodeTypeList() {
        return <div
            className={`absolute top-0 right-0 h-full w-[350px] bg-[#414244] text-white z-50 shadow-lg transform transition-transform duration-300 ${
                (showTriggerTypeList || showNodeTypeList) ? "translate-x-0" : "translate-x-full"
            }`}
            >
            <div className='flex flex-col'>
                <div className='lightGrey px-3 py-5 text-xl font-[Satoshi-Black]'>
                    {
                        showTriggerTypeList 
                        ?
                        "Select a Trigger"
                        :
                        "Select a Node"
                    }
                </div>
                <div className={`flex flex-col`}>
                    {
                        (
                            showTriggerTypeList ? triggerTypeList
                            : currNodeTypeToShow === "basic" ? basicNodeTypeList 
                            : currNodeTypeToShow === "tool" ? toolNodeTypeList
                            : LLMNodeTypeList
                        )
                            .map((nodeType, index) => {
                            return <div onMouseEnter={() => setMouseEnterIndex(index)}
                                onMouseLeave={() => setMouseEnterIndex(null)}
                                onClick={() => {
                                    if (showTriggerTypeList) {
                                        setshowTriggerTypeList(false);
                                        addNodeAndCreateEdge(nodeType.name as NodeType, nodeType.url, nodeType.description)
                                    } else if (showNodeTypeList) {
                                        setShowNodeTypeList(false)
                                        addNodeAndCreateEdge(nodeType.name as NodeType, nodeType.url, nodeType.description)
                                    }
                                    
                                    
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


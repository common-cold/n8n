import { useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "reactflow";
import { CustomSourceHandle, CustomTargetHandle } from "./CustomHandle";
import { Plus } from "react-bootstrap-icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { currentNodeIdAtom, newNodeMetadataAtom, nodeTypeToShow, showNodeTypeListAtom } from "../../store/atoms";

export function AgentNode({id, data: {label, type, image}}: NodeProps<{label: string, type: string, image: string}>) {
    const location = useLocation();
    const navigate = useNavigate();
    const {getEdges} = useReactFlow();
    const setCurrentNodeId = useSetAtom(currentNodeIdAtom);
    const setShowNodeTypeList = useSetAtom(showNodeTypeListAtom);
    const setNodeTypeToShow = useSetAtom(nodeTypeToShow);
    const setNewNodeMetadata = useSetAtom(newNodeMetadataAtom);

    const edges = getEdges();
    const hasOutgoingEdge = edges.some(edge =>
        edge.source === id && edge.sourceHandle === null
    );

    return <div className="relative flex flex-col items-center gap-[7px]">
        <div>
            <div className="relative w-[300px] h-[150px] bg-[#414244] border-2 border-white hover:border-[#ff6f5c] rounded-[10px] text-black p-1 flex justify-center items-center"
                onDoubleClick={() => {
                    setCurrentNodeId(id);
                    navigate(`${location.pathname}/edit/${type}`)
                }}
            >
                <div className="flex justify-between items-center gap-3">
                    <img
                        src={image}
                        className="h-[40px] w-[40px]"
                    />
                    <div className="nodeName">
                        {label}
                    </div>
                    
                </div>
                
            </div>
            <Handle className="!bg-white hover:!bg-[#ff6f5c] !w-[15px] !h-[15px] !border-0" 
                    type="source"
                    position={Position.Right} 
                    style={{
                    top: '50%',               
                    right: 0,
                    left: 292,                
                    transform: 'translateY(-50%)', 
                }}
            />
            {   
                (!hasOutgoingEdge) && 
                <div className="absolute right-[-95px] top-[63px] flex items-center">
                    <div className="h-[3px] w-[70px] bg-white"></div>
                    <button
                        onClick={(e) => {
                            const {clientX, clientY} = e;
                            setNewNodeMetadata({x: clientX, y: clientY, sourceNode: id});
                            setNodeTypeToShow("basic");
                            setShowNodeTypeList(true);
                        }}
                        className="bg-white text-black rounded-full w-6 h-6 flex items-center justify-center"
                    >
                    <Plus size={12} />
                    </button>
                </div>
            }
            <CustomTargetHandle type="target" position={Position.Left} />
            <Handle className="!bg-[#a8aeb7] hover:!bg-[#ff6f5c] !w-[15px] !h-[15px] !border-0" 
                    id="llm-handle"
                    type="source"
                    position={Position.Right} 
                    style={{
                    top: '100%',               
                    right: 0,
                    left: 30,                
                    transform: 'translateY(-50%)', 
                }}
            />
            <div className="absolute left-[35px] bottom-[-70px] flex items-center">
                <div className="relative h-[70px] w-[3px] bg-[#a8aeb7]"></div>
                <button
                    onClick={(e) => {
                        const {clientX, clientY} = e;
                        setNewNodeMetadata({x: clientX, y: clientY, sourceNode: id});
                        setNodeTypeToShow("llm");
                        setShowNodeTypeList(true);
                    }}
                    className="absolute left-[-10px] bottom-[-20px] bg-[#a8aeb7] text-black rounded-full w-6 h-6 flex items-center justify-center"
                >
                <Plus size={12} />
                </button>
            </div>
            <Handle className="!bg-[#a8aeb7] hover:!bg-[#ff6f5c] !w-[15px] !h-[15px] !border-0" 
                    id="tool-handle"
                    type="source"
                    position={Position.Right} 
                    style={{
                    top: '100%',               
                    right: 0,
                    left: 230,                
                    transform: 'translateY(-50%)', 
                }}
            />
            <div className="absolute left-[235px] bottom-[-70px] flex items-center">
                <div className="relative h-[70px] w-[3px] bg-[#a8aeb7]"></div>
                <button
                    onClick={(e) => {
                        const {clientX, clientY} = e;
                        setNewNodeMetadata({x: clientX, y: clientY, sourceNode: id});
                        setNodeTypeToShow("tool");
                        setShowNodeTypeList(true);
                    }}
                    className="absolute left-[-10px] bottom-[-20px] bg-[#a8aeb7] text-black rounded-full w-6 h-6 flex items-center justify-center"
                >
                <Plus size={12} />
                </button>
            </div>
        </div>
    </div>
}


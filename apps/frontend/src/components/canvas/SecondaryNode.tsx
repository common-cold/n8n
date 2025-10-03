import { useState } from "react";
import { Position, useReactFlow, type NodeProps } from "reactflow";
import { CustomSourceHandle, CustomTargetHandle } from "./CustomHandle";
import { Plus } from "react-bootstrap-icons";
import { useCommonReactFlowFunctions } from "../../hooks/react-flow-hooks";
import { useLocation, useNavigate } from "react-router-dom";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { currentNodeIdAtom, newNodeMetadataAtom, showNodeTypeListAtom } from "../../store/atoms";

export function SecondaryNode({id, data: {label, type, image}}: NodeProps<{label: string, type: string, image: string}>) {
    const location = useLocation();
    const navigate = useNavigate();
    const {hasOutgoingEdge} = useCommonReactFlowFunctions();
    const setCurrentNodeId = useSetAtom(currentNodeIdAtom);
    const setShowNodeTypeList = useSetAtom(showNodeTypeListAtom);
    const setNewNodeMetadata = useSetAtom(newNodeMetadataAtom);

    return <div className="relative flex flex-col items-center gap-[7px]">
        <div>
            <div className="w-[130px] h-[120px] bg-[#414244] border-2 border-white hover:border-[#ff6f5c] rounded-[10px] text-black p-1 flex justify-center items-center"
                onDoubleClick={() => {
                    setCurrentNodeId(id);
                    navigate(`${location.pathname}/edit/${type}`)
                }}
            >
                <img
                    src={image}
                    className="h-[40px] w-[40px]"
                />
            </div>
            <CustomSourceHandle type="source" position={Position.Right} />
            {
                !hasOutgoingEdge(id) && 
                <div className="absolute right-[-94px] top-[49px] flex items-center">
                    <div className="h-[3px] w-[70px] bg-white"></div>
                    <button
                        onClick={(e) => {
                            const {clientX, clientY} = e;
                            setNewNodeMetadata({x: clientX, y: clientY, sourceNode: id});
                            setShowNodeTypeList(true);
                        }}
                        className="bg-white text-black rounded-full w-6 h-6 flex items-center justify-center"
                    >
                    <Plus size={12} />
                    </button>
                </div>
            }
            <CustomTargetHandle type="target" position={Position.Left} />
        </div>
        <div className="w-[130px] h-[60px] text-center nodeName">
            {label}
        </div>
    </div>
}
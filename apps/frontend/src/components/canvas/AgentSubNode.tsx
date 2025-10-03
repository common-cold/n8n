import { useState } from "react";
import { Position, useReactFlow, type NodeProps } from "reactflow";
import { CustomSourceHandle, CustomTargetHandle } from "./CustomHandle";
import { Plus } from "react-bootstrap-icons";
import { useCommonReactFlowFunctions } from "../../hooks/react-flow-hooks";
import { useLocation, useNavigate } from "react-router-dom";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { currentNodeIdAtom, newNodeMetadataAtom, showNodeTypeListAtom } from "../../store/atoms";

export function AgentSubNode({id, data: {label, type, image}}: NodeProps<{label: string, type: string, image: string}>) {
    const location = useLocation();
    const navigate = useNavigate();
    const {hasOutgoingEdge} = useCommonReactFlowFunctions();
    const setCurrentNodeId = useSetAtom(currentNodeIdAtom);

    return <div className="relative flex flex-col items-center gap-[7px]">
        <div>
            <div className="relative w-[120px] h-[120px] bg-[#414244] border-2 border-white hover:border-[#ff6f5c] rounded-full text-black p-1 flex justify-center items-center"
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
            <CustomTargetHandle type="target" position={Position.Left} />
        </div>
        <div className="w-[130px] h-[60px] text-center nodeName">
            {label}
        </div>
    </div>
}
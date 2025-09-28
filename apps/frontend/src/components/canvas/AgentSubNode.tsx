import { useState } from "react";
import { Position, useReactFlow, type NodeProps } from "reactflow";
import { CustomSourceHandle, CustomTargetHandle } from "./CustomHandle";
import { Plus } from "react-bootstrap-icons";
import { useCommonReactFlowFunctions } from "../../hooks/react-flow-hooks";
import { useLocation, useNavigate } from "react-router-dom";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { currentNodeIdAtom, newNodeMetadataAtom, showNodeTypeListAtom } from "../../store/atoms";

export function AgentSubNode({id, data: {label, type}}: NodeProps<{label: string, type: string}>) {
    const location = useLocation();
    const navigate = useNavigate();
    const {hasOutgoingEdge} = useCommonReactFlowFunctions();
    const setCurrentNodeId = useSetAtom(currentNodeIdAtom);

    return <div>
        <div className="relative w-[120px] h-[120px] bg-[#414244] border-2 border-white hover:border-[#ff6f5c] rounded-full text-black p-1 flex justify-center items-center"
            onDoubleClick={() => {
                setCurrentNodeId(id);
                navigate(`${location.pathname}/edit/${type}`)
            }}
        >
            {label}
        </div>
        <CustomTargetHandle type="target" position={Position.Left} />
    </div>
}
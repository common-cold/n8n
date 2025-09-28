import { useState } from "react";
import { Position, useReactFlow, type NodeProps } from "reactflow";
import { CustomSourceHandle } from "./CustomHandle";
import { Plus } from "react-bootstrap-icons";
import { useCommonReactFlowFunctions } from "../../hooks/react-flow-hooks";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { newNodeMetadataAtom, nodeTypeToShow, showNodeTypeListAtom, toggleAtom } from "../../store/atoms";

export function PrimaryNode({id, data: {label}}: NodeProps<{label: string}>) {
    const {hasOutgoingEdge} = useCommonReactFlowFunctions();
    const setShowNodeTypeList = useSetAtom(showNodeTypeListAtom);
    const setNewNodeMetadata = useSetAtom(newNodeMetadataAtom);
    const setNodeTypeToShow = useSetAtom(nodeTypeToShow);
    const toggle = useAtomValue(toggleAtom);

    

    return <div>
        <div className="!w-[130px] !h-[120px] !rounded-tl-[60px] !rounded-tr-[20px] !rounded-bl-[60px] !rounded-br-[20px] 
            bg-[#414244] border-2 border-white hover:border-[#ff6f5c] text-black p-1 flex justify-center items-center"
        >
            {label}
        </div>
        <CustomSourceHandle type="source" position={Position.Right} />
        {
            !hasOutgoingEdge(id) && 
            <div className="absolute right-[-100px] top-[49px] flex items-center">
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
    </div>
}
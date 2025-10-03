import { useRef, useState } from "react";
import { Position, useReactFlow, type NodeProps } from "reactflow";
import { CustomSourceHandle } from "./CustomHandle";
import { Plus } from "react-bootstrap-icons";
import { useCommonReactFlowFunctions } from "../../hooks/react-flow-hooks";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { currentNodeIdAtom, currentWorkflowIdAtom, newNodeMetadataAtom, nodesOutputAtom, nodeTypeToShow, showNodeTypeListAtom } from "../../store/atoms";
import { handleRunWorkflow } from "../WorkflowPageHeader";
import { showErrorToast } from "../WorkflowPage";
import { useNavigate } from "react-router-dom";
import type { TriggerType } from "@repo/types";

export function PrimaryNode({id, data: {label, image, type}}: NodeProps<{label: string, image: string, type: TriggerType}>) {
    const {hasOutgoingEdge} = useCommonReactFlowFunctions();
    const setShowNodeTypeList = useSetAtom(showNodeTypeListAtom);
    const setNewNodeMetadata = useSetAtom(newNodeMetadataAtom);
    const setNodeTypeToShow = useSetAtom(nodeTypeToShow);
    const setCurrentNodeId = useSetAtom(currentNodeIdAtom);
    const navigate = useNavigate();
    const currentWorkflowId = useAtomValue(currentWorkflowIdAtom);
    const [nodesOutput, setNodesOutput] = useAtom(nodesOutputAtom);

    const wsRef = useRef<WebSocket | null>(null);
    

    return <div className="relative flex flex-col items-center gap-[7px]">
        <div >
            <div className="!w-[130px] !h-[120px] !rounded-tl-[60px] !rounded-tr-[20px] !rounded-bl-[60px] !rounded-br-[20px] 
                bg-[#414244] border-2 border-white hover:border-[#ff6f5c] text-black p-1 flex justify-center items-center"
                onDoubleClick={() => {
                    if (type === "manual") {
                        if (currentWorkflowId) {
                            handleRunWorkflow(currentWorkflowId, wsRef, setNodesOutput);
                        } else {
                            showErrorToast("Please Save the Workflow")
                        }
                    } else if (type === "webhook") {
                        setCurrentNodeId(id);
                        navigate(`${location.pathname}/edit/${type}`)
                    }
                    
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
        <div className="w-[130px] h-[60px] text-center nodeName">
            {label}
        </div>
    </div>
}
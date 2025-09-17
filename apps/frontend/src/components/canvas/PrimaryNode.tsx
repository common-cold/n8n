import { useState } from "react";
import { Position, type NodeProps } from "reactflow";
import { CustomSourceHandle } from "./CustomHandle";
import { Plus } from "react-bootstrap-icons";
import { useCommonReactFlowFunctions } from "../../hooks/react-flow-hooks";

export function PrimaryNode({id, data: {label}}: NodeProps<{label: string}>) {
    const [open, setOpen] = useState(false);
    const {hasOutgoingEdge, addNodeAndCreateEdge} = useCommonReactFlowFunctions();
    
    return <div>
        <div className="!w-[130px] !h-[120px] !rounded-tl-[60px] !rounded-tr-[20px] !rounded-bl-[60px] !rounded-br-[20px] 
            bg-[#414244] border-2 border-white hover:border-[#ff6f5c] text-black p-1 flex justify-center items-center"
            onClick={() => setOpen(true)}
        >
            {label}
        </div>
        {/* {open && (
            <div className="absolute top-10 left-10 bg-white p-4 border rounded shadow">
            <h3 className="mb-2">Edit Node</h3>
            <input
                type="text"
                defaultValue={label}
                className="border p-1"
            />
            <button
                className="ml-2 px-2 py-1 bg-blue-500 text-white"
                onClick={() => setOpen(false)}
            >
                Close
            </button>
            </div>
        )}

        */}
        <CustomSourceHandle type="source" position={Position.Right} />
        {
            !hasOutgoingEdge(id) && 
            <div className="absolute right-[-100px] top-[49px] flex items-center">
                <div className="h-[3px] w-[70px] bg-white"></div>
                <button
                onClick={() => addNodeAndCreateEdge(id)}
                className="bg-white text-black rounded-full w-6 h-6 flex items-center justify-center"
                >
                <Plus size={12} />
                </button>
            </div>
        }
    </div>
}
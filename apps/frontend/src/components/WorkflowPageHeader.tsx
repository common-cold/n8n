import { useReactFlow } from "reactflow";
import { showErrorToast, showSuccessToast } from "./WorkflowPage";
import { createWorkFlow } from "../utils/utils";
import { useAtom } from "jotai";
import { workflowsAtom } from "../store/atoms";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";



export function WorkflowPageHeader({id} : {id: string}) {
    const [_, setWorkflows] = useAtom(workflowsAtom);
    const {getNodes, getEdges} = useReactFlow();
    const navigate = useNavigate();
    const workflowTitle = useRef<string>("New Workflow");
    const isNew = id == "new";

    async function handleUpsertWorkflow() {
        let response;
        if (isNew) {
            response = await createWorkFlow(workflowTitle.current, getNodes(), getEdges(), false, null);
        } else {
            response = await createWorkFlow(workflowTitle.current, getNodes(), getEdges(), true, id);
        } 

        if (response == null) {
            showErrorToast("Unable To Create Workflow");
        } 
        else if (response.status === 200) {
            if (isNew) {
                showSuccessToast("Workflow Added Successfully!");
                navigate(`/workflows/${response.data.id}`)
            } else {
                showSuccessToast("Workflow Added Successfully!");
            }
            setWorkflows((prev) => [...prev, response.data]);
        } else {
            showErrorToast("Unable To Create Workflow");
        }
        
    }
    return <div className="flex justify-between font-satoshi secondaryColorBg borderStyle px-10 py-2">
        <EditableTitle/>
        <div className="content-center">
            <div onClick={() => handleUpsertWorkflow()}
                className="orangeColorBg text-white font-medium rounded-[3px] px-2 h-7 content-center text-sm cursor-pointer">
                {isNew ? "Create Workflow" : "Save"}
            </div>
        </div>
    </div>

    function EditableTitle() {
        return <input
            className="text-2xl text-[#fff] focus:border-amber-50 text-md py-1 px-1 justify-center items-center font-[Satoshi-Black]"
            onChange={(e) => workflowTitle.current = e.currentTarget.value}
            defaultValue={workflowTitle.current}
        />
    }
}
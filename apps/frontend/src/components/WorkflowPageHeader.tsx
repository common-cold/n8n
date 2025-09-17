import { useReactFlow } from "reactflow";
import { showErrorToast, showSuccessToast } from "./WorkflowPage";
import { createWorkFlow } from "../utils/utils";
import { useAtom } from "jotai";
import { workflowsAtom } from "../store/atoms";
import { useNavigate } from "react-router-dom";



export function WorkflowPageHeader({id} : {id: string}) {
    const [_, setWorkflows] = useAtom(workflowsAtom);
    const {getNodes, getEdges} = useReactFlow();
    const navigate = useNavigate();
    const isNew = id == "new";

    async function handleUpsertWorkflow() {
        let response;
        if (isNew) {
            response = await createWorkFlow("Workflow-1", getNodes(), getEdges(), false, null);
        } else {
            response = await createWorkFlow("Workflow-1", getNodes(), getEdges(), true, id);
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
    return <div className="flex justify-between font-satoshi">
        <div className="flex flex-col">
            <div className="font-bold text-white text-2xl">
                Personal
            </div>
            <div className="text" style={{color: "#979896"}}>
                Workflows and credentials owned by you
            </div>
        </div>
        <div className="content-center">
            <div onClick={() => handleUpsertWorkflow()}
                className="orangeColorBg text-white font-medium rounded-[3px] px-2 h-7 content-center text-sm cursor-pointer">
                {isNew ? "Create Workflow" : "Save"}
            </div>
        </div>
    </div>
}
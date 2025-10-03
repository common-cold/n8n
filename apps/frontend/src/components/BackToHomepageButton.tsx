import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { currentWorkflowIdAtom } from "../store/atoms";

export function BackToHpButton() {
    const navigate = useNavigate();
    const [currentWorkflowId, setCurrentWorkflowId] = useAtom(currentWorkflowIdAtom);
    return  <div onClick={() => {
        setCurrentWorkflowId(null);
        navigate("/homepage");
    }} 
        className="flex w-full h-[30px] rounded-[7px]  cursor-pointer items-center justify-center">
        <div className="text-2xl text-[#ea4b71]">
            n8n
        </div>
    </div>
    
}
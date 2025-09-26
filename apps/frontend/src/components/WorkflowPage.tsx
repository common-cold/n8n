import { ReactFlowProvider } from "reactflow";
import { Canvas } from "./canvas/Canvas";
import toast from "react-hot-toast";
import { Outlet, useParams } from "react-router-dom";
import { WorkflowPageHeader } from "./WorkflowPageHeader";

export function WorkflowPage() {
    let {id} = useParams();

    return id != undefined ?
        (   
            <div>
                <ReactFlowProvider>
                    <div className="relative">
                        <div className="flex flex-row h-screen font-satoshi">
                            <div className="secondaryColorBg w-52 py-5 px-10 borderStyle" >
                                HI
                            </div>
                            <div className="primaryColorBg flex-1 flex flex-col">
                                <WorkflowPageHeader id={id}/>
                                <Canvas id={id}/>
                            </div>
                        </div>
                    </div>
                    <Outlet />
                </ReactFlowProvider>
            </div>
        )
        :
        (
            <div>
    
            </div>
        )
}

export function showSuccessToast(message: string) {
    toast.success(
        <div>
            {message}
        </div>,
        { 
            duration: 5000, 
            style: {
            borderRadius: "5px",
            background: "white",
            color: "black"
        }}
    );  
}

export function showErrorToast(message: string) {
    toast.error(
        <div>
            {message}
        </div>,
        { 
            duration: 5000, 
            style: {
            borderRadius: "5px",
            background: "white",
            color: "black"
        }}
    );  
}
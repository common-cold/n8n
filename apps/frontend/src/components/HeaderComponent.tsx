import { useNavigate } from "react-router-dom";


export function HeaderComponent() {
    const navigate = useNavigate();
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
            <div onClick={() => navigate(`/workflows/new`)}
                className="orangeColorBg text-white font-medium rounded-[3px] px-2 h-7 content-center text-sm cursor-pointer">
                Create Workflow
            </div>
        </div>
    </div>
}
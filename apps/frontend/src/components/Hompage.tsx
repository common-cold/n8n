import { useEffect, useState } from "react";
import { HeaderComponent } from "./HeaderComponent";
import { TabComponent } from "./TabComponent";
import { WorkflowList } from "./WorkflowList";
import { ReactFlowProvider } from "reactflow";
import { getAllUserWorkflows } from "../utils/utils";
import { showErrorToast } from "./WorkflowPage";
import { useNavigate } from "react-router-dom";

export function Homepage() {
    const [tab, setTab] = useState(0);
    const [workflowList, setWorkFlowList] = useState(null);
    const navigate = useNavigate();
    // const workflowList = [
    // {
    //     title: "Hello Workflow 1", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // },
    // {
    //     title: "Telegram Workflow 2", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // },
    // {
    //     title: "Hello Workflow 3", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // },
    // {
    //     title: "Telegram Workflow 4", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // },
    // {
    //     title: "Hello Workflow 5", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // },
    // {
    //     title: "Telegram Workflow 6", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // },
    // {
    //     title: "Hello Workflow 7", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // },
    // {
    //     title: "Telegram Workflow 8", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // },
    // {
    //     title: "Hello Workflow 9", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // },
    // {
    //     title: "Telegram Workflow 10", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // },{
    //     title: "Hello Workflow 11", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // },
    // {
    //     title: "Telegram Workflow 12", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // },
    // {
    //     title: "Hello Workflow 13", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // },
    // {
    //     title: "Telegram Workflow 14", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // },
    // {
    //     title: "Hello Workflow 15", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // },
    // {
    //     title: "Telegram Workflow 16", 
    //     lastUpdatedAt: 1752182037000, 
    //     createdAt: 1736543637000
    // }
    // ]

    async function loadUserWorkflows() {
        const response = await getAllUserWorkflows();
        if (response == null) {
            showErrorToast("Error In Fetching Workflows");
        } else if (response.status === 200 && response.data.length > 0) {
            setWorkFlowList(response.data);
        } else {
            showErrorToast("Error In Fetching Workflows");
        }
    } 
    useEffect(()=> {
        loadUserWorkflows();
    }, []);

    return <ReactFlowProvider>
        <div>
            <div className="flex flex-row h-screen font-satoshi">
                <div className="secondaryColorBg w-52 py-5 px-10" >
                    Hi
                </div>
                <div className="primaryColorBg flex-1 py-5 px-20 flex flex-col gap-7">
                    <HeaderComponent />
                    <div className="flex justify-start gap-6">
                    <TabComponent tab={tab} setTab={setTab} index={0} label="Workflows" />
                    <TabComponent tab={tab} setTab={setTab} index={1} label="Credentials" />
                    <TabComponent tab={tab} setTab={setTab} index={2} label="Executions" />
                    </div>
                    {
                        workflowList != null 
                        ?
                        <WorkflowList list={workflowList} />
                        :
                        <div className="flex justify-center gap-3 text-white my-30">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                    <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375Z" />
                                    <path fillRule="evenodd" d="m3.087 9 .54 9.176A3 3 0 0 0 6.62 21h10.757a3 3 0 0 0 2.995-2.824L20.913 9H3.087Zm6.133 2.845a.75.75 0 0 1 1.06 0l1.72 1.72 1.72-1.72a.75.75 0 1 1 1.06 1.06l-1.72 1.72 1.72 1.72a.75.75 0 1 1-1.06 1.06L12 15.685l-1.72 1.72a.75.75 0 1 1-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                No Workflows Available! 
                            </div>
                        </div>

                    }
                    
                    
                </div>
            </div>
        </div>
    </ReactFlowProvider>
   
}
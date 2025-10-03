import { useReactFlow, useStore, type Node } from "reactflow";
import { showErrorToast, showSuccessToast } from "./WorkflowPage";
import { createWorkFlow, deleteWebhook, runWorkflow, saveWebhook } from "../utils/utils";
import { useAtom, useSetAtom } from "jotai";
import { currentWorkflowIdAtom, nodesOutputAtom, reloadCanvasToggleAtom, workflowsAtom } from "../store/atoms";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { type PubSubToWebSocketMessage, type WebhookTriggerParameters } from "@repo/types";
import { shallow } from 'zustand/shallow'



export function WorkflowPageHeader({id} : {id: string}) {
    const [_, setWorkflows] = useAtom(workflowsAtom);
    const setCurrenWorkflowId = useSetAtom(currentWorkflowIdAtom);
    const {getNodes, getEdges} = useReactFlow();
    const navigate = useNavigate();
    const workflowTitle = useRef<string>("New Workflow");
    const nodes = useStore(state => state.getNodes(), shallow);
    const setNodesFunc = useStore(state => state.setNodes);
    const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
    const [isWebhookflow, setIsWebhookflow] = useState<boolean>(false);
    const [isWebhookActive, setIsWebhookActive] = useState<boolean>(false);
    const [webhookNode, setWebhookNode] = useState<Node | null>(null);
    const [reloadCanvasToggle, setReloadCanvasToggle] = useAtom(reloadCanvasToggleAtom);
    const [nodesOutput, setNodesOutput] = useAtom(nodesOutputAtom);
    const isNew = id == "new";


    // console.log("HEADER NODES: "+ JSON.stringify(getNodes()));

    async function handleUpsertWorkflow() {
        let response;
        if (isNew) {
            response = await createWorkFlow(workflowTitle.current, getNodes(), getEdges(), false, null);
        } else {
            response = await createWorkFlow(workflowTitle.current, getNodes(), getEdges(), true, id);
        } 

        if (response == null) {
            showErrorToast("Unable To Create Workflow");
        } else if (response.status === 200) {
            if (isNew) {
                showSuccessToast("Workflow Added Successfully!");
                navigate(`/workflows/${response.data.id}`)
            } else {
                showSuccessToast("Workflow Updated Successfully!");
            }
            setWorkflows((prev) => [...prev, response.data]);
        } else {
            showErrorToast("Unable To Create Workflow");
        }
    }


    useEffect(() => {
        if (id !== "new") {
            setCurrenWorkflowId(id);
        }
    }, [id]);

    useEffect(() => {
        for (const node of nodes) {
            if (node.type === "primaryNode") {
                if (node.data.type === "webhook") {
                    setWebhookNode(node);
                    setIsWebhookflow(true);
                    setIsWebhookActive(node.data.isActive);
                    const webhookParams = (node.data.parameters as WebhookTriggerParameters);
                    console.log("WEBHOOK PARAMS: " + JSON.stringify(webhookParams));
                    if (webhookParams && webhookParams.webhookUrl) {
                        setWebhookUrl(webhookParams.webhookUrl);
                    }
                }
                break;
            }
        }
    }, [nodes, reloadCanvasToggle]);

    return <div className="flex justify-between font-satoshi secondaryColorBg borderStyle px-10 py-2">
        <EditableTitle/>
        <div className="flex justify-between items-center gap-4">
            {
                isWebhookflow
                &&
                (
                    isWebhookActive
                    ?
                    <DeleteWebhook />
                    :
                    <SaveWebhook />
                )

            }
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

    function SaveWebhook() {
        return <div onClick={() => {
            async function handleSaveWebhook() {
                if (id !== "new") {
                    console.log("HIIIIII: " + JSON.stringify(webhookNode));
                    console.log("HIIIIII: " + JSON.stringify(webhookUrl));
                    if (webhookUrl && webhookNode) {
                        console.log("HIII INNER");
                        const response = await saveWebhook(webhookUrl);
                        if (!response) {
                            showErrorToast("Unable To Save Webhook");
                        } else if (response.status === 200) {
                            showSuccessToast("Successfully Saved Webhook");
                            const updatedNode = webhookNode;
                            updatedNode.data = {
                                ...updatedNode.data,
                                isActive: true
                            }
                            updateWebhookNode(updatedNode);
                            handleUpsertWorkflow();
                            setReloadCanvasToggle(prev => !prev);
                        } else {
                            showErrorToast("Unable To Save Webhook");
                        }
                    }
                    
                } else {
                    showErrorToast("Please Save the Workflow")
                }
            }

            handleSaveWebhook();
        }}
            className="orangeColorBg text-white font-medium rounded-[3px] px-4 h-7 content-center text-sm cursor-pointer">
            Save Webhook
        </div>
    }

    function DeleteWebhook() {
        return <div onClick={() => {
            async function handleDeleteWebhook() {
                if (id !== "new") {
                    if (webhookUrl && webhookNode) {
                        const response = await deleteWebhook(webhookUrl);
                        if (!response) {
                            showErrorToast("Unable To Delete Webhook");
                        } else if (response.status === 200) {
                            showSuccessToast("Successfully Deleted Webhook");
                            const updatedNode = webhookNode;
                            updatedNode.data = {
                                ...updatedNode.data,
                                isActive: false
                            }
                            updateWebhookNode(updatedNode);
                            handleUpsertWorkflow();
                            setReloadCanvasToggle(prev => !prev);
                        } else {
                            showErrorToast("Unable To Delet Webhook");
                        }
                    }
                } else {
                    showErrorToast("Please Save the Workflow")
                }
            }
            handleDeleteWebhook();
        }}
            className="orangeColorBg text-white font-medium rounded-[3px] px-4 h-7 content-center text-sm cursor-pointer">
            Delete Webhook
        </div>
    }

    function updateWebhookNode(updatedNode: Node) {
        const newNodes = nodes.map(node =>
            node.data.type === "webhook"
            ? updatedNode
            : node
        );
        setNodesFunc(newNodes);
    }
}

async function connectToWs(id:string , wsRef: React.RefObject<WebSocket | null>, setNodesOutput: (val: any) => void) {
    wsRef.current = new WebSocket(`ws://localhost:8081?workflowId=${id}`);

    wsRef.current.onopen = () => {
        console.log("WS connected");
    }

    wsRef.current.onmessage = (e) => {
        const data: PubSubToWebSocketMessage = JSON.parse(e.data);
        if (data.success) {
            if (data.data === "END") {
                disconnectWs(wsRef);
                return;
            } else if (data.type === "LOG") {
                showSuccessToast(data.data);
            } else if(data.type === "OUTPUT_UPDATE") {
                const entries = JSON.parse(data.data);
                const map = new Map(entries);
                console.log("ON MESSAGE: " + JSON.stringify(Object.fromEntries(map)));
                setNodesOutput(map);
            }
        } else {
            showErrorToast(data.data);
            disconnectWs(wsRef);
            return;
        }
    }

    wsRef.current.onclose = () => {
        console.log("WS closed");
    }
};

function disconnectWs(wsRef: React.RefObject<WebSocket | null>) {
    if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
    }
};

export async function handleRunWorkflow(id: string, wsRef: React.RefObject<WebSocket | null>, setNodesOutput: (val: any) => void) {
    await connectToWs(id, wsRef, setNodesOutput);
    const response = await runWorkflow(id);
    if (response == null) {
        showErrorToast("Unable To Run Workflow");
        disconnectWs(wsRef);
    } else if (response.status === 200) {
        showSuccessToast("Preparing to Run Workflow");
    } else {
        showErrorToast("Unable To Run Workflow");
        disconnectWs(wsRef)
    }
}
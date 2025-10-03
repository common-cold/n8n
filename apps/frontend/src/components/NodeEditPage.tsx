import { useEffect, useRef, useState } from "react";
import { data, useNavigate, useParams } from "react-router-dom"
import { type GmailCredentials, type TelegramCredentials, type GmailSendMailParamaters, type TelegramSendMessageParamaters, type NodeCredentials, type CredentialType, type CustomNode, type AgentParameters, type FrontendAgentParameters, type LLMParameters, type GeminiCredentials, type ToolParameters, type WebhookTriggerParameters } from "@repo/types";

import telegram from "../assets/telegram.png";
import gmail from "../assets/gmail.png";
import google from "../assets/google.png";
import agent from "../assets/agent.png";
import code from "../assets/code.png";
import webhook from "../assets/webhook.png";

import { DropDownComponent } from "./Dropdown";

import { useCommonReactFlowFunctions } from "../hooks/react-flow-hooks";
import { useAtom, useAtomValue } from "jotai";
import { currentNodeIdAtom, currentWorkflowIdAtom, nodesOutputAtom } from "../store/atoms";
import { decryptCredentialData, getOAuthUrl, getUserCredentialsByType, pollForOAuthStatus, saveCredential } from "../utils/utils";
import { showErrorToast, showSuccessToast } from "./WorkflowPage";
import type { Credential } from "../../../../packages/db/generated/prisma";
import { useReactFlow, type Node } from "reactflow";
import { decryptData } from "@repo/common-utils";

const USER_ID = "01994f06-dcd6-7a30-8de7-356ee6329445";
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

export function NodeEditPage() {
    let {pageId} = useParams();
    const {getNode} = useReactFlow();
    const [showCredentialModal, setShowCredentialModal] = useState(false);
    const navigate = useNavigate();
    const {updateNodeParameters} = useCommonReactFlowFunctions();
    const [currentNodeId] = useAtom(currentNodeIdAtom);
    const [credentialList, setCredentialList] = useState<Credential[]>([]);
    const [nodeRelevantCredList, setNodeRelevantCredList] = useState<Credential[]>([]);
    const [credentialId , setCredentialId] = useState<string | null>(null);
    const [currentCredentialData, setCurrentCredentialData] = useState<NodeCredentials | null>(null);
    const [currentNode, setCurrentNode] = useState<CustomNode | null>(null);
    const currentCredentialName = useRef<string | null>(null);
    const [llmModel ,setllmModel] = useState<string | null>(null);
    const currentWorkflowId = useAtomValue(currentWorkflowIdAtom);
    const [nodesOutput, setNodesOutput] = useAtom(nodesOutputAtom);
    const [currentNodeOutput, setCurrentNodeOutput] = useState<any | null>(null);

    const webhookTriggerParameters = useRef<WebhookTriggerParameters>({
        webhookUrl: ""
    })
    
    const telegramParamaters = useRef<TelegramSendMessageParamaters>({
        chatId: "",
        message: ""
    });

    const gmailParameters = useRef<GmailSendMailParamaters>({
        to: "",
        subject: "",
        emailType: "",
        message: ""
    });

    const agentParameters = useRef<FrontendAgentParameters>({
        prompt: "",
    })

    const geminiParameters = useRef<LLMParameters>({
        modelName: ""
    });

    const codeToolParameters = useRef<ToolParameters>({
        name: "",
        description: "",
        jsCode: "function calculateSum(a, b) {\n    return `Sum is ${a+b}`;\n}",
        inputSchema: {
            "a": "string", 
            "b": "string"
        }
    })

    const telegramCredentials = useRef<TelegramCredentials>({
        accessToken: "",
        baseurl: "https://api.telegram.org"
    })

    const gmailCredentials = useRef<GmailCredentials>({
        oAuthRedirectUrl: "http://localhost:5678/rest/oauth2-credential/callback",
        clientId: "",
        clientSecret: ""
    })

    const geminiCredentials = useRef<GeminiCredentials>({
        host: "https://generativelanguage.googleapis.com",
        apiKey: "",
    })

    const credentialName = useRef("");

    useEffect(() => {
        for (const cred of nodeRelevantCredList) {
            if (cred.id === credentialId) {
                setCurrentCredentialData(JSON.parse(decryptData(cred.data, ENCRYPTION_KEY)));
            }
        }
        function handleEscapeKey(event: KeyboardEvent) {
            if (event.key === "Escape") {
                if (showCredentialModal) {
                    setShowCredentialModal(false);
                } else {
                    navigate(-1);
                }
            }
        }

        window.addEventListener("keydown", handleEscapeKey);

        return () => {
            window.removeEventListener("keydown", handleEscapeKey);
        };
    }, [showCredentialModal]);

    console.log(pageId);
    console.log("model name: " + geminiParameters.current.modelName);

    useEffect(() => {
        async function loadAllUserCredential() {
            const response = await getUserCredentialsByType("all");
            if (!response) {
                showErrorToast("Unable to Fetch User Credentials");
            } else if (response.status === 200) {
                const creds = response.data;
                setCredentialList(creds);
                evaluateNodeRelevantList(creds);
            } else {
                showErrorToast("Unable to Fetch User Credentials");
            }
        }

        function evaluateNodeRelevantList(credentialList: Credential[]) {
            const nodeRelevantCredList = credentialList
                .filter(cred => {
                    if (pageId === "telegram.sendMessage") {
                        return cred.type === "telegram"
                    } else if (pageId === "gmail.sendMail") {
                        return cred.type === "gmail"
                    } else if (pageId === "agent.llm.geminichat") {
                        return cred.type === "gemini"
                    }
                    return false;
            });
            setNodeRelevantCredList(nodeRelevantCredList);
            for (const cred of nodeRelevantCredList) {
                if (cred.id === credentialId) {
                    currentCredentialName.current = cred.name
                }
            }
            for (const cred of nodeRelevantCredList) {
            if (cred.id === credentialId) {
                setCurrentCredentialData(JSON.parse(decryptData(cred.data, ENCRYPTION_KEY)));
            }
        }
        }
        
        loadAllUserCredential();
    }, [credentialId]);

    useEffect(() => {
        function updateCurrentNode() {
            if (currentNodeId != null) {
                const node = getNode(currentNodeId);
                if (node) {
                    const customNodeObj: CustomNode = {
                        id: currentNodeId,
                        name: node?.data.label,
                        type: node.data.type,
                        isPrimaryNode: node.type === "primaryNode",
                        position: node.position,
                        ...(node.data.parameters && { parameters: node.data.parameters }),
                        ...(node.data.credentialId && { credentialId: node.data.credentialId })
                    } 
                    setCurrentNode(customNodeObj);
                    console.log("CUSTOM OBJ CRED ID: " + customNodeObj.credentialId);
                    if (customNodeObj?.credentialId) {
                        setCredentialId(customNodeObj?.credentialId);
                    }
                }
            }
        }
        console.log("NODES OUTPUT: " + JSON.stringify(Object.fromEntries(nodesOutput)));
        setCurrentNodeOutput(nodesOutput.get(currentNodeId!));
        updateCurrentNode();
    }, []);

    useEffect(() => {
            if (!credentialId) {
                return;
            } 
            
            const currentCredential = nodeRelevantCredList.filter(cred => credentialId === cred.id);
            
            if (currentCredential.length == 0) {
                return
            }
            
            setCurrentCredentialData(JSON.parse(decryptData(currentCredential[0].data, ENCRYPTION_KEY)));
            currentCredentialName.current = currentCredential[0].name;
    }, [credentialId]);

    return <div className="fixed inset-0 flex justify-between gap-10 bg-black/40 flex justify-center items-center z-[1000] text-white">
        <div className="w-[400px] h-[600px] secondaryColorBg rounded-[7px] overflow-y-auto">
                <div className="flex flex-col gap-5">
                    {
                        pageId === "telegram.sendMessage" 
                        && 
                        <FormHeader icon={telegram} heading="Send a text message" isCredentialHeader={false}/>
                    }

                    {
                        pageId === "gmail.sendMail" 
                        && 
                        <FormHeader icon={gmail} heading="Send an email" isCredentialHeader={false}/>
                    }

                    {
                        pageId === "agent" 
                        && 
                        <FormHeader icon={agent} heading="Create An AI Agent" isCredentialHeader={false}/>
                    }

                    {
                        pageId === "agent.llm.geminichat" 
                        && 
                        <FormHeader icon={google} heading="Attach an LLM Model To Agent" isCredentialHeader={false}/>
                    }

                    {
                        pageId === "agent.tool.code" 
                        && 
                        <FormHeader icon={code} heading="Attach a Code Tool To Agent" isCredentialHeader={false}/>
                    }
                    
                    {
                        pageId === "webhook" 
                        && 
                        <FormHeader icon={webhook} heading="Your Webhook URL" isCredentialHeader={false}/>
                    }

                    {
                        pageId !== "agent" && pageId !== "agent.tool.code" && pageId !== "webhook" 
                        &&
                        <div className="flex flex-col px-5 gap-2">
                            Credential to connect with
                            <DropDownComponent 
                                options={nodeRelevantCredList} 
                                defaultOption={currentCredentialName.current} 
                                defaultText="Select Credential"
                                onChange={setCredentialId}
                                addNewHandler={() => setShowCredentialModal(true)}
                            />
                        </div>
                    }

                    {
                        pageId === "telegram.sendMessage" && <TelegramParams/>
                    }

                    {
                        pageId === "gmail.sendMail" && <GmailParams/>
                    }

                    {
                        pageId === "agent" && <AgentParams/>
                    }

                    {
                        pageId === "agent.llm.geminichat" && <GeminiParams/>
                    }

                    {
                        pageId === "agent.tool.code" && <CodeToolParams/>
                    }

                    {
                        pageId === "webhook" && <WebhookParams/>
                    }

                </div>
                {showCredentialModal && (
                    <AddCredentialPage />
                )}
        </div>
        {
            (currentNode?.type !== "agent.llm.geminichat" && currentNode?.type !== "agent.tool.code")
            &&
            <div className="w-[400px] h-[600px] secondaryColorBg rounded-[7px] overflow-y-auto">
                <div className="flex flex-col gap-5">
                    <div className="lightGrey flex justify-between px-5 py-3 items-center text-white font-[Satoshi-Black]">
                        Output
                    </div>
                    <div className="px-2">
                        <div className="h-[500px] rounded-[5px] border border-gray-700 px-5 py-2 bg-[#2d2e2e] overflow-auto">
                            <pre className="whitespace-pre-wrap break-words text-white text-sm">
                                {JSON.stringify(currentNodeOutput, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        }
        

    </div>

    function TelegramParams() {
        const currentParameters = currentNode?.parameters as TelegramSendMessageParamaters;
        if (currentParameters) {
            telegramParamaters.current = {
                chatId: currentParameters.chatId,
                message: currentParameters.message
            }
        }
        return <>
            <div className="flex flex-col px-5 gap-1">
                Chat ID
                <input onChange={(e) => {
                    telegramParamaters.current.chatId = e.currentTarget.value
                }}  
                    className="inputStyle" 
                    defaultValue={currentParameters?.chatId ?? ""}
                />
            </div>
            <div className="flex flex-col px-5 gap-1">
                Message
                <input onChange={(e) => {
                    telegramParamaters.current.message = e.currentTarget.value
                }}  
                    className="inputStyle" 
                    defaultValue={currentParameters?.message ?? ""}
                />
            </div>
        </>
    }

    function GmailParams() {
        const currentParameters = currentNode?.parameters as GmailSendMailParamaters;
        if (currentParameters) {
            gmailParameters.current = {
                to: currentParameters.to,
                subject: currentParameters.subject,
                emailType: currentParameters.emailType,
                message: currentParameters.message
            }
        }
        return <>
            <div className="flex flex-col px-5 gap-1">
                To
                <input onChange={(e) => {
                    gmailParameters.current.to = e.currentTarget.value
                }}  
                    className="inputStyle" 
                    defaultValue={currentParameters?.to ?? ""}
                />
            </div>
            <div className="flex flex-col px-5 gap-1">
                Subject
                <input onChange={(e) => {
                    gmailParameters.current.subject = e.currentTarget.value
                }}  
                    className="inputStyle" 
                    defaultValue={currentParameters?.subject ?? ""}
                />
            </div>
            <div className="flex flex-col px-5 gap-1">
                Email Type
                <input onChange={(e) => {
                    gmailParameters.current.emailType = e.currentTarget.value
                }}  
                    className="inputStyle" 
                    defaultValue={currentParameters?.emailType ?? ""}
                />
            </div>
            <div className="flex flex-col px-5 gap-1">
                Message
                <input onChange={(e) => {
                    gmailParameters.current.message = e.currentTarget.value
                }}  
                    className="inputStyle" 
                    defaultValue={currentParameters?.message ?? ""}
                />
            </div>
        </>
    }

    function AgentParams() {
        const currentParameters = currentNode?.parameters as FrontendAgentParameters;
        if (currentParameters) {
            agentParameters.current = {
                prompt: currentParameters.prompt
            }
        }
        return <>
            <div className="flex flex-col px-5 gap-1">
                Prompt
                <textarea onChange={(e) => {
                    agentParameters.current.prompt = e.currentTarget.value
                }}  
                    className="inputStyle overflow-y-auto"
                    style={{height: "200px", width: "100%"}}

                    defaultValue={currentParameters?.prompt ?? ""}
                />
            </div>
        </>    
    }

    function GeminiParams() {
        const currentParameters = currentNode?.parameters as LLMParameters;
        if (currentParameters) {
            geminiParameters.current = {
                modelName: currentParameters.modelName
            }
        }
        return <>
            <div className="flex flex-col px-5 gap-1">
                Model Name
                <DropDownComponent 
                    options={[{
                        name: "Gemini 2.0 Flash",
                        id: "Gemini 2.0 Flash"
                    }]} 
                    defaultOption={geminiParameters.current.modelName} 
                    defaultText="Select Model"
                    onChange={(val) => {
                        geminiParameters.current.modelName = val
                        setllmModel(val);
                    }}
                    addNewHandler={null}
                />
            </div>
        </>    
    }

    function CodeToolParams() {
        const currentParameters = currentNode?.parameters as ToolParameters;
        if (currentParameters) {
            codeToolParameters.current = {
                name: currentParameters.name,
                description: currentParameters.description,
                jsCode: currentParameters.jsCode,
                inputSchema: currentParameters.inputSchema
            }
        }
        return <>
            <div className="flex flex-col px-5 gap-1">
                Name
                <input onChange={(e) => {
                    codeToolParameters.current.name = e.currentTarget.value
                }}  
                    className="inputStyle" 
                    defaultValue={currentParameters?.name ?? ""}
                />
            </div>
            <div className="flex flex-col px-5 gap-1">
                Description
                <input onChange={(e) => {
                    codeToolParameters.current.description = e.currentTarget.value
                }}  
                    className="inputStyle" 
                    defaultValue={currentParameters?.description ?? ""}
                />
            </div>
            <div className="flex flex-col px-5 gap-1">
                Javascript Code
                <textarea onChange={(e) => {
                    codeToolParameters.current.jsCode = e.currentTarget.value
                }}  
                    className="inputStyle overflow-y-auto"
                    style={{height: "200px", width: "100%"}}
                    spellCheck="false"
                    wrap="soft"
                    defaultValue={currentParameters?.jsCode ?? "function calculateSum(a, b) {\n    return `Sum is ${a+b}`;\n}"}
                />
            </div>
            <div className="flex flex-col px-5 gap-1">
                Input Schema
                <textarea onChange={(e) => {
                    codeToolParameters.current.inputSchema = JSON.parse(e.currentTarget.value)
                }}  
                    className="inputStyle overflow-y-auto"
                    style={{height: "150px", width: "100%"}}
                    spellCheck="false"
                    wrap="soft"
                    defaultValue={JSON.stringify(currentParameters?.inputSchema) ?? 
                        JSON.stringify({
                            "a": "string", 
                            "b": "string"
                        })
                    }
                />
            </div>
        </>    
    }

    function WebhookParams() {
        let webhookUrl;
        const currentParameters = currentNode?.parameters as WebhookTriggerParameters;
        if (currentParameters) {
            webhookTriggerParameters.current = {
                webhookUrl: currentParameters.webhookUrl
            }
        } else if (currentWorkflowId) {
            console.log("came inside currentworkflowID IF");
            webhookUrl = `http://localhost:8082/webhook/${currentWorkflowId}`;
            webhookTriggerParameters.current = {
                webhookUrl: webhookUrl
            }
        }
        return <>
            <div className="flex flex-col px-5 gap-1">
                Webhook Id
                <div className="h-[60px] rounded-[5px] border border-gray-700 px-[10px] py-2 bg-[#2d2e2e]">
                    { 
                        currentWorkflowId
                        ?
                        webhookTriggerParameters.current.webhookUrl
                        :
                        "Please Save the Workflow First"                        
                    }
                </div>
            </div>
        </>    
    }

    function FormHeader({icon, heading, isCredentialHeader} : {icon: string, heading: string, isCredentialHeader: boolean}) {
        return  <div className="lightGrey flex justify-between px-5 py-3 items-center">
            <div className="flex justify-start gap-2.5 items-center">
                <img
                    className="iconStyle"
                    src={icon}
                />
                {
                    isCredentialHeader ?
                    <EditableTitle defaultValue={heading}/>
                    :
                    <div className="text-white font-[Satoshi-Black]">
                        {heading}
                    </div>
                }
                
            </div>
                <div onClick={() => {
                    if (pageId === "webhook") {
                        if (!currentWorkflowId) {
                            showErrorToast("Please Save the Workflow First");
                        } else {
                            updateNodeParameters(currentNodeId!, webhookTriggerParameters.current, credentialId);
                        }
                        navigate(-1);
                    } else if (pageId === "telegram.sendMessage") {
                        if (isCredentialHeader) {
                            handleSaveCredential(telegramCredentials.current, credentialName.current, "telegram", USER_ID);
                        } else {
                            updateNodeParameters(currentNodeId!, telegramParamaters.current, credentialId);
                            navigate(-1);
                        }
                    } else if (pageId === "gmail.sendMail") {
                        if (isCredentialHeader) {
                            handleSaveCredential(gmailCredentials.current, credentialName.current, "gmail", USER_ID);
                        } else {
                            updateNodeParameters(currentNodeId!, gmailParameters.current, credentialId);
                            navigate(-1);
                        }
                    } else if (pageId === "agent") {
                        updateNodeParameters(currentNodeId!, agentParameters.current, credentialId);
                        navigate(-1);
                    } else if (pageId === "agent.llm.geminichat") {
                        if (isCredentialHeader) {
                            handleSaveCredential(geminiCredentials.current, credentialName.current, "gemini", USER_ID);
                        } else {
                            updateNodeParameters(currentNodeId!, geminiParameters.current, credentialId);
                            navigate(-1);
                        }
                    } else if (pageId === "agent.tool.code") {
                        updateNodeParameters(currentNodeId!, codeToolParameters.current, credentialId);
                        navigate(-1);
                    }
                }}
                    className="orangeColorBg text-white font-medium rounded-[3px] px-2 h-7 content-center text-sm cursor-pointer">
                    Save
                </div>
        </div>
    }

    function AddCredentialPage() {
        return <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[1000] text-white">
            <div className="w-[700px] h-[500px] secondaryColorBg rounded-[7px]">
                <div className="flex flex-col gap-3">
                    {
                        pageId === "telegram.sendMessage" 
                        && 
                        <>
                            <FormHeader icon={telegram} heading="New Telegram Credential" isCredentialHeader={true}/>
                            <TelegramCredentialParams/>
                        </>
                        
                    }

                    {
                        pageId === "gmail.sendMail" 
                        && 
                        <>
                            <FormHeader icon={gmail} heading="New Gmail Credential" isCredentialHeader={true}/>
                            <GmailCredentialParams/>
                        </>
                    }

                    {
                        pageId === "agent.llm.geminichat" 
                        && 
                        <>
                            <FormHeader icon={google} heading="New Gemini Credential" isCredentialHeader={true}/>
                            <GeminiCredentialParams/>
                        </>
                    }
                </div>
            </div>
        </div>
    }

    function EditableTitle({defaultValue} : {defaultValue: string}) {
        credentialName.current = defaultValue;
        return <input
            className="focus:border-amber-50 text-md py-1 px-1 justify-center items-center font-[Satoshi-Black]"
            onChange={(e) => credentialName.current = e.currentTarget.value}
            defaultValue={defaultValue}
        />
    }

    function TelegramCredentialParams() {
        const tgCredentialParams = currentCredentialData as TelegramCredentials;
        if (tgCredentialParams) {
            telegramCredentials.current = {
                accessToken: tgCredentialParams.accessToken,
                baseurl: tgCredentialParams.baseurl
            }
        }
        return <>
            <div className="flex flex-col px-5 gap-1">
                Access Token
                <input onChange={(e) => {
                    telegramCredentials.current.accessToken = e.currentTarget.value
                }}  
                    className="inputStyle" 
                    type="password"
                    defaultValue={tgCredentialParams?.accessToken ?? ""}
                />
            </div>
            <div className="flex flex-col px-5 gap-1">
                Base URL
                <input onChange={(e) => {
                    telegramCredentials.current.baseurl = e.currentTarget.value
                }}  
                    className="inputStyle" 
                    defaultValue={tgCredentialParams?.baseurl ?? "https://api.telegram.org"}
                />
            </div>
        </>
    }

    function GmailCredentialParams() {
        const gmailCredentialsParam = currentCredentialData as GmailCredentials;
        if (gmailCredentialsParam) {
            gmailCredentials.current = {
                oAuthRedirectUrl: gmailCredentialsParam.oAuthRedirectUrl,
                clientId: gmailCredentialsParam.clientId,
                clientSecret: gmailCredentialsParam.clientSecret
            }
        }
        return <>
            <div className="flex flex-col px-5 gap-1">
                OAuth Redirect URL
                <input onChange={(e) => {
                    gmailCredentials.current.oAuthRedirectUrl = e.currentTarget.value
                }}  
                    className="inputStyle" 
                    defaultValue={
                        gmailCredentialsParam?.oAuthRedirectUrl
                        ??
                        "http://localhost:5678/rest/oauth2-credential/callback"
                    }
                />
            </div>
            <div className="flex flex-col px-5 gap-1">
                Client ID
                <input onChange={(e) => {
                    gmailCredentials.current.clientId = e.currentTarget.value
                }}  
                    className="inputStyle" 
                    type="password"
                    defaultValue={gmailCredentialsParam?.clientId ?? ""}
                />
            </div>
            <div className="flex flex-col px-5 gap-1">
                Client Secret
                <input onChange={(e) => {
                    gmailCredentials.current.clientSecret = e.currentTarget.value
                }}  
                    className="inputStyle" 
                    type="password"
                    defaultValue={gmailCredentialsParam?.clientSecret ?? ""}
                />
            </div>
            <SignInToGoogleButton/>
        </>
    }

    function GeminiCredentialParams() {
        const geminiCredentialParams = currentCredentialData as GeminiCredentials;
        if (geminiCredentialParams) {
            geminiCredentials.current = {
                host: geminiCredentialParams.host,
                apiKey: geminiCredentialParams.apiKey
            }
        }
        return <>
            <div className="flex flex-col px-5 gap-1">
                Host
                <input onChange={(e) => {
                    geminiCredentials.current.host = e.currentTarget.value
                }}  
                    className="inputStyle" 
                    defaultValue={geminiCredentialParams?.host ?? "https://generativelanguage.googleapis.com"}
                />
            </div>
            <div className="flex flex-col px-5 gap-1">
                API Key
                <input onChange={(e) => {
                    geminiCredentials.current.apiKey = e.currentTarget.value
                }}  
                    className="inputStyle" 
                    type="password"
                    defaultValue={geminiCredentialParams?.apiKey ?? ""}
                />
            </div>
        </>
    }

    async function handleSaveCredential(credentials: NodeCredentials, credentialName: string, credentialType: CredentialType, userId: string) {
        const response = await saveCredential(credentials, credentialName, credentialType, userId);
        if (!response) {
            showErrorToast("Unable To Save Credentials");
        } else if (response.status === 200) {
            setCredentialId(response.data);
            showSuccessToast("Successfully Saved Credential");
        } else {
            showErrorToast("Unable To Save Credentials");
        }
    }

    function SignInToGoogleButton () {
        return <div onClick={() => handleGetOAuthUrl()} 
            className="flex justify-center mt-5">
            <div className="flex flex-row items-center">
                <div className="px-2 py-1 bg-[#f4f4f4]">
                    <img
                        className="w-[24px] h-[24px]"
                        src={google}
                    />
                </div>
                <div className="text-white font-[Satoshi-Medium] bg-[#4285f4] px-2 py-1">
                    Sign In To Google
                </div>
            </div>
        </div>
    }
    
    async function handleGetOAuthUrl() {
        if (!credentialId) {
            return;
        }
        const response = await getOAuthUrl(credentialId);
         if (!response) {
            showErrorToast("OAuth Failure");
        } else if (response.status === 200) {
            window.open(
                response.data,
                "google-oauth",
                "width=500,height=600,left=200,top=100"
            );     
            const res = await pollForOAuthStatus(credentialId);
            if (res) {
                setShowCredentialModal(false);
                showSuccessToast("OAuth Success");
                setCredentialId(credentialId);
            }
        } else {
            showErrorToast("OAuth Failure");
        }
    }
}
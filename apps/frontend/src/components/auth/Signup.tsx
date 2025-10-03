import { useState } from "react"
import { signup } from "../../utils/utils"
import { showErrorToast } from "../WorkflowPage"
import { useNavigate } from "react-router-dom"

export type AuthBoxInputProps = {
    name: string,
    argsTupleArray: [string, (val: string) => void][]
    handleSubmit: () => Promise<void>
    isSignUp: boolean
}


// export function Signup() {
//     return <div className="primaryColorBg flex-1 py-5 px-20 h-screen">
//         <div className="flex flex-col justify-center items-center gap-7">
//             <HeaderComponent/>
//             <SignupBox/>
//         </div>
//     </div>
// }


export function SignupBox() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstname, setFirstname] = useState("");
    const [lastName, setLastName] = useState("");
    const navigate = useNavigate();

    async function saveUser() {
        const response = await signup({
            email: email,
            password: password,
            firstName: firstname,
            lastName: lastName
        });
        if (!response) {
            showErrorToast("Unable to Signup");
        } else if (response.status === 200) {
            const token = response.data.token;
            localStorage.setItem("token", token);
            navigate("/homepage");
        } else if (response.status === 400) {
            showErrorToast("Email already exists");
        } else {
            showErrorToast("Unable to Signup");
        }
    } 
    return <AuthBoxInputs 
        name="Sign Up" 
        argsTupleArray=
            {
                [
                    ["Email", setEmail], 
                    ["Password", setPassword],
                    ["First Name", setFirstname],
                    ["Last Name", setLastName]
                ]
            } 
        handleSubmit={saveUser}
        isSignUp={true}
        />
        
}

function HeaderComponent() {
    return <div className="flex flex-col gap-3 items-center justify-center">
        <div className="text-5xl text-[#ea4b71]">
            n8n
        </div>
        <div className=" text-xl text-white">
            Automate anything. Connect your apps. Build powerful workflows without code.
        </div>
    </div>
}


export function AuthBoxInputs({name, argsTupleArray, handleSubmit, isSignUp}: AuthBoxInputProps) {
    return <div className={`flex flex-col gap-5 secondaryColorBg ${isSignUp ? "h-[460px]" : "h-[300px]"} w-[400px] rounded-[10px] py-3 px-6`}>
        <div className="flex text-white text-2xl font-bold items-center justify-center">
            {name}
        </div>
        {
            argsTupleArray.map(([label, setter], i) => {
                return <div key={i} className="flex flex-col text-white gap-1">
                    <div className="flex text-white text-lg font-bold justify-start">
                        {label}
                    </div>
                    <div>
                        <input className="inputStyle w-full" onChange={(e) => setter(e.target.value)}/>
                    </div>
                </div>
            })
        }
        
        <div onClick={() => {
            async function callHandleSubmit() {
                await handleSubmit();
            }

            callHandleSubmit();
        }} 
            className="flex items-center justify-center h-[40px] w-full mt-2 orangeColorBg text-white font-bold rounded-[10px]">
                Submit
        </div>
    </div>
}
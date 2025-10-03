import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthBoxInputs } from "./Signup";
import { showErrorToast } from "../WorkflowPage";
import { signin } from "../../utils/utils";

// export function Signup() {
//     return <div className="primaryColorBg flex-1 py-5 px-20 h-screen">
//         <div className="flex flex-col justify-center items-center gap-7">
//             <HeaderComponent/>
//             <SignupBox/>
//         </div>
//     </div>
// }


export function SignInBox() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    

    async function signInUser() {
        const response = await signin({
            email: email,
            password: password,
        });
        if (!response) {
            showErrorToast("Unable to Signin");
        } else if (response.status === 200) {
            const token = response.data.token;
            localStorage.setItem("token", token);
            navigate("/homepage");
        } else if (response.status === 400) {
            console.log("RESSSSSSSSS: " + response!.data);
            console.log("RESSSSSSSSS: " + response.data);
            showErrorToast(response.data);
        } else {
            console.log("ELSE    RESSSSSSSSS: " + response!.data);
            showErrorToast("Unable to Signin");
        }
    } 
    return <AuthBoxInputs
        name="Sign In" 
        argsTupleArray=
            {
                [
                    ["Email", setEmail], 
                    ["Password", setPassword],
                ]
            } 
        handleSubmit={signInUser}
        isSignUp={false}
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
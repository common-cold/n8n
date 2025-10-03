import { useState } from "react"
import { TabComponent } from "../TabComponent"
import { SignupBox } from "./Signup";
import { SignInBox } from "./SignIn";

export function AuthPage() {
    const [tab, setTab] = useState(0);

    return <div className="primaryColorBg flex-1 py-5 px-20 h-screen">
        <div className="flex flex-col justify-center items-center gap-7">
            <HeaderComponent/>
            <div className="flex justify-start gap-6">
                <TabComponent tab={tab} setTab={setTab} index={0} label="SignUp" />
                <TabComponent tab={tab} setTab={setTab} index={1} label="SignIn" />
            </div>
            {
                tab === 0
                ?
                <SignupBox/>
                :
                <SignInBox/>
            }
        </div>
    </div>
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
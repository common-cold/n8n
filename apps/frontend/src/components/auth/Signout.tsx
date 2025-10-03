import { useNavigate } from "react-router-dom";

export function Signout() {
    const navigate = useNavigate();
    return  <div onClick={() => {
        localStorage.removeItem("token");
        navigate("/");
    }} 
        className="flex w-full h-[30px] rounded-[7px] cursor-pointer orangeColorBg text-white font-bold items-center justify-center">
        Signout
    </div>
    
}
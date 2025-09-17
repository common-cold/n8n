import { useEffect } from "react";
import { useNavigate } from "react-router-dom"

export function NodeConfigModal() {
    const navigate = useNavigate();

    useEffect(() => {
        function handleEscapeKey(e: KeyboardEvent) {
            if (e.key === "Escape") {
                navigate(-1);
            }
        }
        window.addEventListener("keydown", handleEscapeKey);
        return () => removeEventListener("keydown", handleEscapeKey);
   
    }, [navigate]);
    
    
    
    
    return <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[1000]">
        <div className="w-[400px] bg-white p-5 rounded-lg">
                Hi there
        </div>
    </div>
}







    //   [
    //         {
    //             source: 1,
    //             targets: [
    //                 {
    //                     target: 2,
    //                 },
    //                 {
    //                     target: 3,
    //                 }
    //             ]
    //         },
    //         {
    //             source: 2,
    //             targets: [
    //                 {
    //                     target: 4,
    //                 },
    //             ]
    //         },
    //         {
    //             source: 4,
    //             targets: [
    //                 {
    //                     target: 5,
    //                 },
    //             ]
    //         },
    //         {
    //             source: 3,
    //             targets: [
    //                 {
    //                     target: 6,
    //                 },
    //             ]
    //         },
    //     ]
    //     [(1 -> 2), (1 -> 3), (2 -> 4), (4 -> 5), (3 -> 6)],

    //     [
    //         {
    //             source: 2,
    //             target: 2,
    //             response: {}
    //         },
    //         {
    //             source: 1,
    //             target: 3,
    //             response: {}
    //         },
    //     ]
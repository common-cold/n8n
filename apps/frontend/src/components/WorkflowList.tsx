import { useState } from "react"
import { useNavigate } from "react-router-dom";
import type { Workflow } from "../../../../packages/db/generated/prisma";



export function WorkflowList({list} : {list: Workflow[]}) {
    const [page, setPage] = useState(1);
    const navigate = useNavigate();
    const rowsPerPage = 5;
    const maxPages = Math.ceil(list.length/rowsPerPage);
    const startIndex = (page - 1) * 5;
    const rows = list.slice(startIndex, startIndex + rowsPerPage);

    return <div className="flex flex-col gap-3">
        {
            rows.map((workflow, index) => {
                return <div key={index} className="secondaryColorBg rounded-[7px] w-full p-3" onClick={() => navigate(`/workflows/${workflow.id}`)}>
                    <div className="flex flex-col">
                        <div className="text-white">
                            {workflow.name}
                        </div>
                        <div style={{color: "#979896", fontSize: "13px"}}>
                            Last Updated {convertDateToHumanReadable(workflow.updatedAt)} | Created {convertDateToHumanReadable(workflow.createdAt)}
                        </div>
                    </div>
                </div>
            })
        }
        <div className="flex justify-end gap-3">
            <div   
                style={{color: page === 1 ? "#979896" : "#ff6f5c", cursor: "pointer"}} 
                onClick={page != 1 ? () => setPage(page - 1) : undefined} >
                {'<'}
            </div>
            <div className="p-1 border-1 border-solid rounded-[4px] w-8 h-8" style={{borderColor: "#ff6f5c", color: "#ff6f5c"}}>
                <div className="flex justify-center items-center">
                    {page}
                </div>
            </div>
            <div 
                style={{color: page === maxPages ? "#979896" : "#ff6f5c", cursor: "pointer"}} 
                onClick={page != maxPages ? () => setPage(page + 1) : undefined} >
                {'>'}
            </div>
        </div>
    </div>
}



function convertDateToHumanReadable(date: Date) {
    const epoch = new Date(date).getTime();
    const now = Date.now();
    const diff = now - epoch
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);

    if (sec < 60) return `${sec}s ago`;
    if (min < 60) return `${min}m ago`;
    if (hr < 24) return `${hr}h ago`;
    return `${day}d ago`;
}
import { Handle, type HandleProps } from "reactflow";

export function CustomSourceHandle(props: HandleProps) {
    return <Handle  className="!bg-white hover:!bg-[#ff6f5c] !w-[15px] !h-[15px] !border-0" 
            {...props}
            style={{
            top: '50%',               
            right: 0,
            left: 122,                
            transform: 'translateY(-50%)', 
        }}
        />   
}


export function CustomTargetHandle(props: HandleProps) {
    return <Handle  className="!bg-white hover:!bg-[#ff6f5c] !w-[10px] !h-[30px] !rounded-none !border-0"
        {...props}
        style={{
            top: '50%',               
            right: 0,
            left: -4,                
            transform: 'translateY(-50%)', 
        }}
    />
}
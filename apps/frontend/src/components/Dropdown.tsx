import { useState } from "react";
import type { Credential } from "../../../../packages/db/generated/prisma";
import { Pencil } from "react-bootstrap-icons";

export type GenericDropDownProp = {name: string, id: string};

type DropDownProps  = {
    options: Credential[] | GenericDropDownProp[],
    defaultOption: string | null,
    defaultText: string,
    onChange: (option: string) => void,
    addNewHandler: (() => void) | null
}

type OptionProps = {
    option?: Credential | GenericDropDownProp, 
    index: number,
    isAddNewOption: boolean
} 

export function DropDownComponent({ options, defaultOption, defaultText, onChange, addNewHandler}: DropDownProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(defaultOption);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div className="flex flex-col relative">
            <div className="flex justify-center items-center gap-2">
                <div onClick={() => setIsExpanded(prev => !prev)}
                    className="flex justify-between items-center inputStyle cursor-pointer flex-1"
                >
                    <div
                        className="flex justify-start items-center"
                        onClick={() => {
                            setIsExpanded(prev => !prev);
                        }}
                    >
                        {
                            selectedOption
                            ?
                            defaultOption
                            :
                            defaultText
                        }
                    </div>
                    <div
                        className="bg-transparent border-none"
                    >
                        <svg
                            className={`w-[18px] h-[18px] transition-transform ${
                                isExpanded ? "rotate-180" : "rotate-0"
                            } stroke-[white]`}
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                </div>
                {
                    (addNewHandler != null && selectedOption !== null) 
                    &&
                    (
                        <div onClick={() => {
                            addNewHandler();
                        }}>
                            <Pencil/>
                        </div>
                    )
                }
            </div>
            {isExpanded && (
                <div
                    className="overflow-y-auto overflow-x-hidden transition-all duration-300 max-h-[120px] absolute w-full top-full left-0 z-[999] bg-white border border-[#525456] rounded-[3px] mt-[2px] shadow-[0_4px_8px_rgba(0,0,0,0.1)]"
                >
                    {
                        addNewHandler != null 
                        &&
                        <OptionComponent index={0} isAddNewOption={true} />
                    }
                    {options.map((option, index) => (
                       <OptionComponent option={option} index={index + 1} isAddNewOption={false}/>
                    ))}
                </div>
            )}
        </div>
    );

    function OptionComponent({option, index, isAddNewOption}: OptionProps) {
        return <div
            key={index}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
                if (isAddNewOption) {
                    if (addNewHandler)
                        addNewHandler();
                } else {
                    setSelectedOption(option!.name);
                    onChange(option!.id);
                    setIsExpanded(false);
                }  
            }}
            className={`flex justify-start px-[10px] py-[8px] cursor-pointer transition-colors duration-300 ${
                hovered === index ? "bg-[#414244]" : "bg-[#2d2e2e]"
            }`}
        >
            {isAddNewOption ? "+ Add New Credential" : option!.name}
        </div>
    }
}


import type { Edge, Node } from "reactflow";
import { generateUUID } from "../../utils/utils";

export let initialEdges: Edge[] = [];

export let initialNodes: Node[] = [
    {
        id: generateUUID(),
        position: {x: 10, y: 10},
        data: {
            label: "Node 1"
        },
        type: "primaryNode"
    },
]
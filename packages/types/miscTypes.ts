import type { Connections, CustomNode } from "./dbTypes"

export type UpsertWorkFlow = {
    name: string,
    nodes: CustomNode[],
    connections: Connections,
    userId: string
}

export type GetWorkFlow = {
    userId: string
}
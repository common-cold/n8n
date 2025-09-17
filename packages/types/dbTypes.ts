export type TargetInfo = {
    targetId: string,
    connectionId: string,
}

export type Targets = Array<TargetInfo>

export type SourceInfo = {
    sourceId: string,
    targets: Targets
}

export type Connections = Array<SourceInfo>

export type NodeType = "primaryNode" | "secondaryNode"

export type CustomNode = {
    id: string,
    name: string,
    type: NodeType,
    position: {
        x: number,
        y: number
    }
}

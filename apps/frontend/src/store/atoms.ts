import { atom } from "jotai";
import type { Workflow } from "../../../../packages/db/generated/prisma";
import { type ApiParamNodeType } from "@repo/types";


export const workflowsAtom = atom<Workflow[]>([]);

export const currentWorkflowIdAtom = atom<string | null>(null);

export const currentNodeIdAtom = atom<string | null>(null);

export const showTriggerTypeListAtom = atom<boolean>(false);

export const showNodeTypeListAtom = atom<boolean>(false);

export const nodeTypeToShow = atom<ApiParamNodeType>("basic");

export const newNodeMetadataAtom = atom<{x: number, y: number, sourceNode: string} | null>(null);

export const reloadCanvasToggleAtom = atom<boolean>(true);

export const nodesOutputAtom = atom<
    Map<string, { 
        [key: string]: any
    }>
>(new Map());
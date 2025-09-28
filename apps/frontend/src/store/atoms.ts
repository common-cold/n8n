import { atom } from "jotai";
import type { Workflow } from "../../../../packages/db/generated/prisma";
import { type ApiParamNodeType } from "@repo/types";


export const workflowsAtom = atom<Workflow[]>([]);

export const currentNodeIdAtom = atom<string | null>(null);

export const showNodeTypeListAtom = atom<boolean>(false);

export const nodeTypeToShow = atom<ApiParamNodeType>("basic");

export const newNodeMetadataAtom = atom<{x: number, y: number, sourceNode: string} | null>(null);

export const toggleAtom = atom<boolean>(true);
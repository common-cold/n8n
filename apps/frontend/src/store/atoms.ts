import { atom } from "jotai";
import type { Workflow } from "../../../../packages/db/generated/prisma";


export const workflowsAtom = atom<Workflow[]>([]);

export const currentNodeIdAtom = atom<string | null>(null);

export const showNodeTypeListAtom = atom<boolean>(false);

export const newNodeMetadataAtom = atom<{x: number, y: number, sourceNode: string} | null>(null);

export const toggleAtom = atom<boolean>(true);
import { atom } from "jotai";
import type { Workflow } from "../../../../packages/db/generated/prisma";


export const workflowsAtom = atom<Workflow[]>([]);

export const currentWorkflowIdAtom = atom<string | null>(null);

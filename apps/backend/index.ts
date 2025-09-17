import dotenv from "dotenv";
import { join } from "path";
import express from "express";
import cors from "cors";
import type { GetWorkFlow, UpsertWorkFlow } from "@repo/types";
import { prisma } from "@repo/db/client";

dotenv.config({ path: join(__dirname, "..", "..", ".env") });

const app = express();

app.use(cors());
app.use(express.json());

const USER_ID = "01994f06-dcd6-7a30-8de7-356ee6329445";

app.post("/signup", async(req, res) => {
    const body = req.body;
    try {
        const user = await prisma.user.create({
            data: {
                email: body.email,
                password: body.password,
                firstName: body.firstName,
                lastName: body.lastName,
            }
        });
        return res.status(200).json({
            id: user.id
        })
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: e
        });
    }
    
});

app.post("/workflow", async(req, res) => {
    const body: UpsertWorkFlow = req.body;

    try {
        const workflow = await prisma.workflow.create({
            data: {
                name: body.name,
                nodes: body.nodes,
                connections: body.connections,
                userId: body.userId,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        return res.status(200).json(workflow);
    } catch (e) {
        return res.status(500).json({
            message: e
        });
    }
});

app.put("/workflow/:id", async(req, res) => {
    const workflowId = req.params.id;
    const userId = USER_ID;
    const body: UpsertWorkFlow = req.body;
    try {
        const userDb = await prisma.user.findFirst({
            where: {
                id: userId
            }
        });

        if (!userDb) {
            return res.status(400).json({
                message: "User does not exist"
            });
        }

        const workflowDb = await prisma.workflow.findFirst({
            where: {
                id: workflowId,
                userId: userDb.id
            }
        });

        if (!workflowDb) {
            return res.status(400).json({
                message: "Workflow does not exist"
            });
        }

        const workflow = await prisma.workflow.update({
            where: {
                id: workflowDb.id
            },
            data: {
                name: body.name,
                nodes: body.nodes,
                connections: body.connections,
                updatedAt: new Date()
            }
        });

        return res.status(200).json(workflow);
        
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: e
        });
    }
});

app.get("/workflow/partial", async(req, res) => {
    const userId = USER_ID;
    try {
        const userDb = await prisma.user.findFirst({
            where: {
                id: userId
            }
        });

        if (!userDb) {
            return res.status(400).json({
                message: "User does not exist"
            });
        }
        
        const workflows = await prisma.workflow.findMany({
            where: {
                userId: userDb.id
            },
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                updatedAt: "asc"
            }
        });


        if (!workflows) {
            return res.status(200).json([]);
        }

        return res.status(200).json(workflows);  
    } catch (e) {
        console.log("came here");
        console.log(e);
        return res.status(500).json({
            message: e
        });
    } 
});


app.get("/workflow/:id", async(req, res) => {
    const workflowId = req.params.id;
    const userId = USER_ID;
    try {
        const userDb = await prisma.user.findFirst({
            where: {
                id: userId
            }
        });

        if (!userDb) {
            return res.status(400).json({
                message: "User does not exist"
            });
        }

        const workflowDb = await prisma.workflow.findFirst({
            where: {
                id: workflowId,
                userId: userDb.id
            }
        });

        if (!workflowDb) {
            return res.status(400).json({
                message: "Workflow does not exist"
            });
        }

        return res.status(200).json(workflowDb);  
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: e
        });
    }
});





app.listen(8080);
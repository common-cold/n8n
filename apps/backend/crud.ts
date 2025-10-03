import dotenv from "dotenv";
import { join } from "path";
import express from "express";
import cors from "cors";
import type { GetNodeType, GetTriggerType, GetWorkFlow, GmailCredentials, NodeType, PostCredential, SignInReqBody, SignupReqBody, UpsertWorkFlow } from "@repo/types";
import { prisma } from "@repo/db/client";
import {redisClient, workflowQueue} from "@repo/redis";
import { decryptData, encryptData, hashString, validatePass, WEBHOOK_MAP } from "@repo/common-utils";
import axios from "axios";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware";

dotenv.config({ path: join(__dirname, "..", "..", ".env") });

export type RunWorkflowResult = {
    success: boolean,
    message: string
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const JWT_SECRET = process.env.JWT_SECRET!;

export const app = express();

app.use(cors());
app.use(express.json());


app.post("/signup", async(req, res) => {
    const body: SignupReqBody = req.body;
    try {
        const exists = await prisma.user.findFirst({
            where: {
                email: body.email
            }
        });
        if (exists) {
            return res.status(400).json("Email Exists");
        }
        const hashedPassword = hashString(body.password);
        const user = await prisma.user.create({
            data: {
                email: body.email,
                password: hashedPassword,
                firstName: body.firstName,
                lastName: body.lastName,
            }
        });

        const token = jwt.sign({
            userId: user.id
        }, JWT_SECRET);
        
        return res.status(200).json({
            token: token
        })
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: e
        });
    }
    
});

app.post("/signin", async(req, res) => {
    const body: SignInReqBody = req.body;
    try {
        const userDb = await prisma.user.findFirst({
            where: {
                email: body.email
            }
        });
        if (!userDb) {
            return res.status(400).json("User does not Exist");
        }

        if (!validatePass(body.password, userDb.password)) {
            return res.status(400).json("Wrong Password");
        }

        const token = jwt.sign({
            userId: userDb.id
        }, JWT_SECRET);
        
        return res.status(200).json({
            token: token
        })
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: e
        });
    }
});

app.post("/workflow", authMiddleware, async(req, res) => {
    const body: UpsertWorkFlow = req.body;
    const userId = (req as any).user.userId;

    try {
        const workflow = await prisma.workflow.create({
            data: {
                name: body.name,
                nodes: body.nodes,
                connections: body.connections,
                userId: userId,
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

app.put("/workflow/:id", authMiddleware, async(req, res) => {
    const workflowId = req.params.id;
    const userId = (req as any).user.userId;
    const body: UpsertWorkFlow = req.body;
    try {
        const workflowDb = await prisma.workflow.findFirst({
            where: {
                id: workflowId,
                userId: userId
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

app.get("/workflow/partial", authMiddleware, async(req, res) => {
    const userId = (req as any).user.userId
    console.log("USERID: " + userId);
    try {        
        const workflows = await prisma.workflow.findMany({
            where: {
                userId: userId
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
        return res.status(500).json({
            message: e
        });
    } 
});


app.get("/workflow/:id", authMiddleware, async(req, res) => {
    const workflowId = req.params.id;
    const userId = (req as any).user.userId;
    try {
        const workflowDb = await prisma.workflow.findFirst({
            where: {
                id: workflowId,
                userId: userId
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


// app.get("/workflow/run/:id", authMiddleware, async(req, res) => {
//     const workflowId = req.params.id;
//     const userId = (res as any).user.userId;
//     try {
//         const workflowDb = await prisma.workflow.findFirst({
//             where: {
//                 id: workflowId,
//                 userId: userId
//             }
//         });

//         if (!workflowDb) {
//             return res.status(400).json({
//                 message: "Workflow does not exist"
//             });
//         }

//         workflowQueue.add("workflow", workflowDb);
//         return res.status(200).json("Workflow Added to queue");
//     } catch (e) {
//         console.log(e);
//         return res.status(500).json({
//             message: e
//         });
//     }
// });

app.get("/workflow/get/:id", async(req, res) => {
    const count = await workflowQueue.getWaiting();
    return res.json(count);
});

app.get("/node-type/:type", async(req, res) => {
    const {type} = req.params;
    let nodeTypes;
    let filtered: GetNodeType[] = [];
    try {
        nodeTypes = await prisma.nodeType.findMany();
        if (type === "basic") {
            filtered = nodeTypes.filter(nodeType => !nodeType.name.startsWith("agent."));
        } else if (type === "llm"){
            filtered = nodeTypes.filter(nodeType => nodeType.name.startsWith("agent.llm."));
        } else if (type === "tool") {
            filtered = nodeTypes.filter(nodeType => nodeType.name.startsWith("agent.tool."));
        }
        return res.status(200).json(filtered);
    } catch (e) {
        res.status(500).json({
            message: e
        });
    }
});

app.post("/node-type", async(req, res) => {
    const body: GetNodeType = req.body;
    try {
        const nodeType = await prisma.nodeType.create({
            data: {
                name: body.name,
                description: body.description,
                url: body.url
            }
        });
        res.status(200).json(nodeType);
    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: e
        });
    }
});

app.put("/node-type/:id", async(req, res) => {
    const id = req.params.id;
    const body: GetNodeType = req.body;

    try {
        const nodeTypes = await prisma.nodeType.update({
            where: {
                id: id
            },
            data: {
                name: body.name,
                description: body.description
            }
        });
        res.status(200).json(nodeTypes);
    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: e
        });
    }
});

app.get("/trigger-type", async (req, res) => {
    try {
        const triggerTypes = await prisma.triggerType.findMany({});
        return res.status(200).json(triggerTypes);
    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: e
        });
    }    
})

app.post("/trigger-type", async (req, res) => {
    const body: GetTriggerType = req.body;
    try {
        const triggerType = await prisma.triggerType.create({
            data: {
                name: body.name,
                description: body.description,
                url: body.url
            }
        });
        res.status(200).json(triggerType);
    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: e
        });
    }
});



app.post("/credential", authMiddleware, async(req ,res) => {
    const body: PostCredential = req.body;
    const userId = (req as any).user.userId;
    try {
        const credential = await prisma.credential.create({
            data: {
                name: body.name,
                data: body.data,
                userId: userId,
                type: body.type,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
        
        return res.status(200).json(credential.id);
    } catch (e) {
        return res.status(500).json({
            message: e
        });
    }

});

app.get("/credential/:id", authMiddleware, async(req, res) => {
    const {id} = req.params;
    const userId = (req as any).user.userId;

    try {
        let credentials;
        if (id === "all") {
            credentials = await prisma.credential.findMany({
                where: {
                    userId: userId
                }
            });
        } else {
            credentials = await prisma.credential.findMany({
                where: {
                    userId: userId,
                    type: id
                }
            });
        }
        
        if (!credentials) {
            return res.status(200).json([]);
        }

        return res.status(200).json(credentials);  
    } catch (e) {
        return res.status(500).json({
            message: e
        });
    }
});

app.get("/oauth/auth", async (req, res) => {
    try {
        const state = decodeURIComponent(req.query.state as string);

        const credentialId = decryptData(state, ENCRYPTION_KEY!);
    
        const credentialDb = await prisma.credential.findFirst({
            where: {
                id: credentialId
            }
        });

        if (!credentialDb) {
            return res.status(400).json({
                message: "Credential does not exist"
            });
        }

        const gmailCredential: GmailCredentials = JSON.parse(decryptData(credentialDb.data, ENCRYPTION_KEY!));

        const OAUTH_URI = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${gmailCredential.clientId}&redirect_uri=http://localhost:8080/oauth/callback&response_type=code&scope=https://mail.google.com/&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}` ;

        return res.status(200).json(OAUTH_URI);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: e
        });
    } 
});

app.get("/oauth/callback", async (req, res) => {
    try {
        const code = req.query.code;
        const state = decodeURIComponent(req.query.state as string);


        const credentialId = decryptData(state, ENCRYPTION_KEY!);

        const credentialDb = await prisma.credential.findFirst({
            where: {
                id: credentialId
            }
        });

        if (!credentialDb) {
            return res.status(400).json({
                message: "Credential does not exist"
            });
        }

        const gmailCredential: GmailCredentials = JSON.parse(decryptData(credentialDb.data, ENCRYPTION_KEY!));

        const body = {
            code: code,
            client_id: gmailCredential.clientId,
            client_secret: gmailCredential.clientSecret,
            redirect_uri: "http://localhost:8080/oauth/callback",
            grant_type: "authorization_code"
        }

        const tokenRes = await axios.post("https://oauth2.googleapis.com/token", body, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded" 
            },    
        });

        const token = tokenRes.data;

        //update gmail credential object by adding refresh token and expiry in it
        gmailCredential.refreshToken = token.refresh_token;
        gmailCredential.expiresIn = token.refresh_token_expires_in;

        //encrypt it
        const encryptedCredentialData = encryptData(JSON.stringify(gmailCredential), ENCRYPTION_KEY!); 

        //save in credentialDb
        const updatedCredential = await prisma.credential.update({
            where: {
                id: credentialId
            },
            data: {
                data: encryptedCredentialData   
            }
        });

        await redisClient.set(credentialId, "true");
        await redisClient.expire(credentialId, 3 * 60);

        res.send(`
            <!DOCTYPE html>
            <html>
            <body>
                <script>
                window.close();
                </script>
            </body>
            </html>
        `);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: e
        });
    }
});

app.get("/oauth/status/:credentialId", async (req, res) => {
    try {
        const {credentialId} = req.params;
        if (!credentialId) {
            return res.status(200).json("false");
        }
        const value = await redisClient.get(credentialId);
        console.log("Got Value: " + value);
        if (!value) {
            return res.status(200).json("false");
        }
        return res.status(200).json("true");
    } catch (e) {
        return res.status(200).json("false");
    }
});

app.post("/run/workflow/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const response: RunWorkflowResult = await runWorkflow(id);
        if (response.success) {
            return res.status(200).json(response.message);
        } else {
            return res.status(400).json(response.message);
        }
    } catch (e) {
        return res.status(500).json({
            message: e
        });
    }
});

app.post("/webhook", async (req, res) => {
    const body = req.body;
    if (!body.url) {
        return res.status(400).json("Webhook cannot be empty");
    }
    const url = new URL(body.url as string);
    const key = url.pathname;
    const splitValues = key.split("/");
    const workflowId = splitValues[2];
    await redisClient.hSet(WEBHOOK_MAP, key, workflowId);
    return res.status(200).json("Webhook saved successfully");
});

app.delete("/webhook", async (req, res) => {
    const body = req.body;
    console.log("BODY = " + body);
    if (!body.url) {
        return res.status(400).json("Webhook cannot be empty");
    }
    const url = new URL(body.url as string);
    const key = url.pathname;
    await redisClient.hDel(WEBHOOK_MAP, key);
    return res.status(200).json("Webhook deleted successfully");
});

export async function runWorkflow(id: string): Promise<RunWorkflowResult> {
    
    const workflowDb = await prisma.workflow.findFirst({
        where: {
            id: id
        },
        select: {
            id: true,
            name: true,
            nodes: true,
            connections: true,
            userId: false,
            createdAt: false,
            updatedAt: false,
            user: false,
        }
    });

    if (!workflowDb) {
        return {
            success: false,
            message: "Workflow does not exist"
        }
    }

    const result = await workflowQueue.add("add-workflow", workflowDb);
    return {
        success: true,
        message: "Running Workflow"
    }
}


import dotenv from "dotenv";
import { join } from "path";
import express from "express";
import cors from "cors";
import type { GetNodeType, GetWorkFlow, GmailCredentials, NodeType, PostCredential, UpsertWorkFlow } from "@repo/types";
import { prisma } from "@repo/db/client";
import {redisClient, workflowQueue} from "@repo/redis";
import { decryptData, encryptData } from "@repo/common-utils";
import axios from "axios";
import { json } from "stream/consumers";
import { randomUUIDv7 } from "bun";

dotenv.config({ path: join(__dirname, "..", "..", ".env") });

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

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


app.get("/workflow/run/:id", async(req, res) => {
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

        workflowQueue.add("workflow", workflowDb);
        return res.status(200).json("Workflow Added to queue");
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: e
        });
    }
});

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
        const nodeTypes = await prisma.nodeType.create({
            data: {
                name: body.name,
                description: body.description,
                url: body.url
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

app.post("/credential", async(req ,res) => {
    const body: PostCredential = req.body;
    try {
        const credential = await prisma.credential.create({
            data: {
                name: body.name,
                data: body.data,
                userId: USER_ID,
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

app.get("/credential/:id", async(req, res) => {
    const {id} = req.params;
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
        
        let credentials;
        if (id === "all") {
            credentials = await prisma.credential.findMany({
                where: {
                    userId: userDb.id
                }
            });
        } else {
            credentials = await prisma.credential.findMany({
                where: {
                    userId: userDb.id,
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

app.listen(8080);

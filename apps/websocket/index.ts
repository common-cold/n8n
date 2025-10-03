import { CHANNEL_NAME } from "@repo/common-utils";
import { subscriberClient } from "@repo/redis";
import type { PubSubToWebSocketMessage } from "@repo/types";
import type { ServerWebSocket } from "bun";


type WSData = {
    workflowId: string | null;
};

let clientMap = new Map<string, ServerWebSocket<WSData>>(); 

await subscriberClient.subscribe(CHANNEL_NAME, async(data) => {
    console.log(data);
    const message: PubSubToWebSocketMessage = JSON.parse(data);
    const ws = clientMap.get(message.id);
    if (ws) {
        ws!.send(data);    
    }
})

Bun.serve({
    port: 8081,
    fetch(req, server) {
        const url = new URL(req.url);
        const data: WSData = {
            workflowId: url.searchParams.get("workflowId"),
        };
        if (server.upgrade(req, {data})) {
            return;
        }
        return new Response("Upgrade failed", { status: 500 });
    },
    websocket: {
        open(ws) {
            const workflowId = (ws.data as WSData).workflowId;
            console.log("ID: " + workflowId)
            if (workflowId != null) {
                clientMap.set(workflowId, ws as ServerWebSocket<WSData>);
            }
            console.log("OPEN");
            console.log(JSON.stringify(Array.from(clientMap.entries())));
        },
        message(ws, message) {},
        close(ws) {
            const workflowId = (ws.data as WSData).workflowId;
            if (workflowId) {
                clientMap.delete(workflowId);
            }
            console.log("CLosed");
            console.log(JSON.stringify(Array.from(clientMap.entries())));
        }
    }
});
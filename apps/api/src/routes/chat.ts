import { Hono } from "hono";
import { cors } from "hono/cors";
import { routeMesssage } from "src/ai/router.js";
import { getCurrentUser } from "src/services.js";
import { prisma } from "@repo/db";
import { supportAgent, billingAgent, orderAgent } from "src/ai/agents.js";
import { MessageRole, AgentType } from "@repo/db";

const chatRouter = new Hono();
// chatRouter.use("*", cors());
chatRouter.onError((err, c) => {
    console.error("Error:", err);
    return c.json({ error: 'Internal Server Error' }, 500);
});

chatRouter.post("/", async (c) => {
    const { conversationId, message } = await c.req.json();
    const conversationIdNum = conversationId ? parseInt(conversationId) : undefined;
    const user = await getCurrentUser();
    const conversation = await getConversation(conversationIdNum);
    const currentAgentType = conversation.agent;
    console.log(`Received message for conversation ID: ${conversationIdNum} | ${conversationId}`);

    await saveMessage(conversation.id, MessageRole.USER, message);

    const agentType = routeMesssage(message, currentAgentType);

    let stream;

    const historyMessages = await getRecentMessages(conversation.id);
    const historyText = await buildMessageHistoryText(historyMessages);
    // console.log("Message history:\n", historyText, "\n---------\n");

    if (agentType === AgentType.ORDER) {
        console.log("Testing: Order agent triggered!")
        stream = await orderAgent(user.id, `Recent messages:\n${historyText}\nCurrent message:\nUser: ${message}`);
    } else if (agentType === AgentType.BILLING) {
        console.log("Testing: Billing agent triggered!")
        stream = await billingAgent(user.id, `Recent messages:\n${historyText}\nCurrent message:\nUser: ${message}`);
    } else {
        console.log("Testing: Support agent triggered!")
        stream = await supportAgent(`Recent messages:\n${historyText}\nCurrent message:\nUser: ${message}`);
    }

    stream.text.then(async (response) => {
        await saveMessage(conversation.id, MessageRole.ASSISTANT, response);
    });

    const response = stream.toTextStreamResponse();

    console.log("Setting X-Conversation-Id header to:", conversation.id);
    response.headers.set("X-Conversation-Id", String(conversation.id));

    if (agentType !== currentAgentType) {
        await setConversationAgent(conversation.id, agentType);
        response.headers.set("X-Agent-Type", agentType);
    }


    return response;
})

chatRouter.get('/messages/:conversationId', async (c) => {
    const conversationId = parseInt(c.req.param('conversationId'));

    const messages = await getRecentMessages(conversationId, 100);
    return c.json(messages);
})

chatRouter.get('/conversationIDs', async (c) => {
    const conversations = await prisma.conversation.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            agent: true,
        }
    });
    return c.json(conversations);
});

async function getConversation(conversationId?: number) {
    const conversation =
        conversationId
            ? await prisma.conversation.findUniqueOrThrow({
                where: { id: conversationId }
            })
            : await prisma.conversation.create({
                data: {}
            });

    return conversation;
}

async function setConversationAgent(conversationId: number, agentType: AgentType) {
    console.log(`Test: Setting conversation ${conversationId} agent to ${agentType}`);
    await prisma.conversation.upsert({
        where: { id: conversationId },
        update: {
            agent: agentType
        },
        create: {
            id: conversationId,
            agent: agentType,
        }
    })
}

async function saveMessage(conversationId: number, role: MessageRole, content: string) {
    await prisma.message.create({
        data: {
            conversationId,
            role,
            content
        }
    })
}

async function getRecentMessages(conversationId: number, limit: number = 6) {
    return await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: limit
    })
}

async function buildMessageHistoryText(messages: { role: MessageRole, content: string }[]) {
    return messages
        .map(m => `${m.role === MessageRole.USER ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");
}

export default chatRouter;
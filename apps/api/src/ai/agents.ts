import { prisma } from '@repo/db';
import { generateText, streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { getCurrentUser, getOrders, getProducts, getSubscriptions, getInvoices } from 'src/services.js';

export async function supportAgent(message: string) {
    return streamText({
        model: groq("llama-3.1-8b-instant"),
        prompt: `${message}`,
        system: `You are a helpful customer support agent. Answer the user's question as best as you can. Act like a real human, not a robot.`
    });
}

export async function orderAgent(userId: number, message: string) {
    const order = await getOrders(userId);
    return streamText({
        model: groq("llama-3.1-8b-instant"),
        prompt: `${message}\n
        Data fetched from database:
        Recent orders: ${JSON.stringify(order, null, 2)}.
        Explain clearly.`,
        system: `You are a helpful customer support agent specialized in order related issues. Use the recent orders data to answer the user's question. If the question is not related to the orders, still try to answer as best as you can. Be professional. The orders data are provided from the system, not the user, so analyze the data yourself and provide a response based on that. Act like a real human, not a robot.`
    });
}

export async function billingAgent(userId: number, message: string) {   
    const subscriptions = await getSubscriptions(userId);
    const refundedOrders = await getOrders(userId, undefined, undefined, true);
    const invoices = await getInvoices(userId);
    console.log("Billing agent data:", { subscriptions, refundedOrders, invoices });
    return streamText({
        model: groq("llama-3.1-8b-instant"),
        prompt: `${message}\n
        Data fetched from database:
        Recent subscriptions: ${JSON.stringify(subscriptions, null, 2)}.
        Recent refunded orders: ${JSON.stringify(refundedOrders, null, 2)}.
        Recent invoices: ${JSON.stringify(invoices, null, 2)}.
        Explain clearly.`,
        system: `You are a helpful customer support agent specialized in billing related issues. Use the recent subscriptions, refunded orders and invoices data to answer the user's question. If the question is not related to the billing, still try to answer as best as you can. Be professional. The data are provided from the system, not the user, so analyze the data yourself and provide a response based on that. Act like a real human, not a robot.`
    });
}
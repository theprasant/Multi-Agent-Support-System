import { AgentType } from '@repo/db';

export function routeMesssage(message: string, currentAgentType?: AgentType): AgentType {
    const m = message.toLowerCase();
    if (m.includes('order') || m.includes('deliver')) {
        return AgentType.ORDER;
    }
    if (m.includes('billing') || m.includes('invoice') || m.includes('payment') || m.includes('refund')) {
        return AgentType.BILLING;
    }

    return currentAgentType || AgentType.SUPPORT;
}
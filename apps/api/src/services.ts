import { prisma } from '../db.js';
import { OrderStatus, InvoiceStatus } from '../../../packages/db/generated/prisma/client.js';

// There's only a sample user in the db for now
async function getCurrentUser() {
    return prisma.user.findFirstOrThrow({
        where: {
            email: "developer.prasant@gmail.com"
        }
    })
}

async function getProducts() {
    const products = await prisma.product.findMany({
        orderBy: { id: 'asc' }
    });
    return products;
}

async function getOrders(userId: number, statusParam?: String, invoiceStatusParam?: String, refunded?: boolean) {
    const status = Object.values(OrderStatus).includes(statusParam as OrderStatus) ? statusParam as OrderStatus : undefined;
    const invoiceStatus = Object.values(InvoiceStatus).includes(invoiceStatusParam as InvoiceStatus) ? invoiceStatusParam as InvoiceStatus : undefined;

    const orders = await prisma.order.findMany({
        where: {
            userId: userId,
            ...(status && { status }),
            ...(invoiceStatus && {
                invoices: {
                    some: { status: invoiceStatus }
                }
            }),
            ...(refunded && { invoices: { some: { refunds: { some: {} } } } })
        },
        include: {
            product: true,
            invoices: {
                include: { refunds: true }
            }
        },
        orderBy: { id: 'asc' },
        take: 10
    });

    return orders;
}

async function getSubscriptions(userId: number) {
    const subscriptions = await prisma.subscription.findMany({
        where: { userId },
        orderBy: { id: 'asc' },
    });

    return subscriptions;
}

async function getInvoices(userId: number) {
    const invoices = await prisma.invoice.findMany({
        where: {
            order: {
                userId: userId
            }
        },
        orderBy: { id: 'asc' },
        include: {
            refunds: true,
        }
    });

    return invoices;
}

export {
    getCurrentUser,
    getProducts,
    getOrders,
    getSubscriptions,
    getInvoices
}
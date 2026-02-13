import { prisma } from "../src/client";

async function main() {
    console.log("Seeding database...");

    const user = await prisma.user.upsert({
        where: { email: "developer.prasant@gmail.com" },
        update: {},
        create: {
            email: "developer.prasant@gmail.com",
            name: "Prasant",
        }
    })

    const products = await Promise.all([
        prisma.product.upsert({
            where: { id: 1 },
            update: {},
            create: {
                name: "Notebook",
                price: 9.99,
            }
        }),
        prisma.product.upsert({
            where: { id: 2 },
            update: {},
            create: {
                name: "Pen",
                price: 1.99,
            }
        }),
    ])

    const order = await prisma.order.create({
        data: {
            productId: products[1].id,
            status: "APPROVED",
            userId: user.id,
            invoices: {
                create: {
                    amount: products[1].price,
                    status: "PAID",
                    refunds: { 
                        create: { amount: products[1].price, } 
                    }
                }
            }
        }
    })


    console.log("✅ Seed complete");
    console.log({ user, products, order });

}

await main()
    .catch((e) => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
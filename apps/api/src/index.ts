import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from "hono/cors";
import { getCurrentUser, getProducts, getOrders, getSubscriptions } from './services.js';
import chatRouter from './routes/chat.js';

const app = new Hono();

app.use("*", cors({
  origin: "*",
  exposeHeaders: ["X-Conversation-Id", "X-Agent-Type"],
}));

app.onError((err, c) => {
  console.error("API error:", err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

app.route('/api/chat', chatRouter);

// Products
app.get('/products', async (c) => {
  const products = await getProducts();
  return c.json(products);
});

//  Orders
app.get('/orders', async (c) => {

  const user = await getCurrentUser();

  const statusParam = c.req.query('status');
  const invoiceStatusParam = c.req.query('invoiceStatus');
  const refunded = c.req.query('refunded')?.trim().toLowerCase() === 'true';

  const orders = await getOrders(user.id, statusParam, invoiceStatusParam, refunded);

  return c.json(orders);
});

// Subscriptions
app.get('/subscriptions', async (c) => {

  const user = await getCurrentUser();

  const subscriptions = await getSubscriptions(user.id);

  return c.json(subscriptions);
});

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});


serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
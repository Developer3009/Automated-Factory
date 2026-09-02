import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Client } from 'pg';

dotenv.config({ path: ['.env.local', '.env'] });

const app = express();
const port = Number(process.env.PORT ?? 4000);
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const jwtSecret = process.env.JWT_SECRET ?? 'smartplant-dev-secret';
const adminCredentials = {
  email: (process.env.ADMIN_EMAIL ?? 'admin@smartplant.local').toLowerCase(),
  password: process.env.ADMIN_PASSWORD ?? 'SmartPlant@2026',
  role: 'admin',
};
const client = new Client({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/smartplant',
});

function createSignedToken(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', jwtSecret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifySignedToken(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [header, payload, signature] = parts;
    const expected = createHmac('sha256', jwtSecret).update(`${header}.${payload}`).digest('base64url');
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email?: string; role?: string; iat?: number };
    if (!decoded.email || !decoded.role) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

const fallbackMachines = [
  { id: 1, name: 'M-101', type: 'CNC Ultra', status: 'Running', temperature: 71, efficiency: 93, vibration: 2.4, description: 'Precision machining for alloy housings' },
  { id: 2, name: 'M-102', type: 'Laser Cutter', status: 'Idle', temperature: 48, efficiency: 81, vibration: 1.7, description: 'Sheet cutting and contour trimming' },
  { id: 3, name: 'M-103', type: 'Press Line', status: 'Running', temperature: 83, efficiency: 87, vibration: 3.1, description: 'High-volume stamping operations' },
  { id: 4, name: 'M-104', type: 'Packaging', status: 'Maintenance', temperature: 58, efficiency: 76, vibration: 1.5, description: 'Labeling and packing unit' },
  { id: 5, name: 'M-105', type: 'Robotic Arm', status: 'Running', temperature: 65, efficiency: 92, vibration: 2.2, description: 'Assembly line handling' },
  { id: 6, name: 'M-106', type: 'Mixer', status: 'Idle', temperature: 52, efficiency: 80, vibration: 1.6, description: 'Blend preparation for ceramic slurry' },
];

const fallbackInventory = [
  { id: 1, title: 'Basmati Rice', quantity: 105, unit: 'pieces', price: 1000 },
  { id: 2, title: 'Weel', quantity: 30, unit: 'pieces', price: 900 },
  { id: 3, title: 'Soap', quantity: 9, unit: 'pieces', price: 50 },
  { id: 4, title: 'Shop', quantity: 0, unit: 'pieces', price: 90 },
  { id: 5, title: 'Lampa', quantity: 112, unit: 'pieces', price: 1 },
  { id: 6, title: 'Demo', quantity: 100, unit: 'pieces', price: 10 },
  { id: 7, title: 'Test block', quantity: 0, unit: 'pieces', price: 150 },
];

const fallbackProduction = [
  { id: 1, product_name: 'Soap', machine_name: 'M-101', quantity: 455, status: 'In Progress', estimate_time: '12:45 HR', date: 'Aug 7, 2026' },
  { id: 2, product_name: 'Basmati Rice', machine_name: 'M-102', quantity: 20, status: 'Pending', estimate_time: '11:30 HR', date: 'Jul 15, 2026' },
  { id: 3, product_name: 'Basmati Rice', machine_name: 'M-103', quantity: 50, status: 'Completed', estimate_time: '10:00 HR', date: 'Jun 19, 2026' },
  { id: 4, product_name: 'Basmati Rice', machine_name: 'M-104', quantity: 1, status: 'In Progress', estimate_time: '5:00 HR', date: 'Jun 8, 2026' },
  { id: 5, product_name: 'Weel', machine_name: 'M-105', quantity: 10, status: 'Completed', estimate_time: '10:00 HR', date: 'May 7, 2026' },
];

const fallbackCustomers = [
  { id: 1, name: 'Aarav Sharma', email: 'aarav@zenith.co', company: 'Zenith Foods', status: 'Active' },
  { id: 2, name: 'Pooja Verma', email: 'pooja@optima.ai', company: 'Optima AI', status: 'Active' },
  { id: 3, name: 'Nikhil Rao', email: 'nikhil@precision.in', company: 'Precision Works', status: 'VIP' },
  { id: 4, name: 'Sana Iqbal', email: 'sana@harbor.net', company: 'Harbor Supply', status: 'Active' },
];

const fallbackProducts = [
  { id: 1, name: 'Soap', category: 'Cleaning', stock: 455, unit: 'pieces', price: 120 },
  { id: 2, name: 'Basmati Rice', category: 'Food', stock: 215, unit: 'kg', price: 85 },
  { id: 3, name: 'Weel', category: 'Industrial', stock: 90, unit: 'pieces', price: 310 },
  { id: 4, name: 'Lampa', category: 'Lighting', stock: 200, unit: 'pieces', price: 150 },
];

const fallbackOrders = [
  { id: 1, customer: 'Aarav Sharma', product: 'Soap', total: 4200, status: 'Paid', createdAt: '2026-08-12' },
  { id: 2, customer: 'Pooja Verma', product: 'Basmati Rice', total: 6600, status: 'Processing', createdAt: '2026-08-18' },
  { id: 3, customer: 'Nikhil Rao', product: 'Weel', total: 15500, status: 'Shipped', createdAt: '2026-08-22' },
  { id: 4, customer: 'Sana Iqbal', product: 'Lampa', total: 7500, status: 'Paid', createdAt: '2026-08-27' },
];

const fallbackVendors = [
  { id: 1, name: 'North Star Logistics', category: 'Transport', leadTime: '2 days', performance: '98%' },
  { id: 2, name: 'Green Valley Mills', category: 'Raw Material', leadTime: '4 days', performance: '94%' },
  { id: 3, name: 'BluePeak Components', category: 'Machine Parts', leadTime: '6 days', performance: '96%' },
  { id: 4, name: 'Everlight Energy', category: 'Utilities', leadTime: '3 days', performance: '90%' },
];

const fallbackRawMaterials = [
  { id: 1, title: 'Steel Rod', quantity: 640, unit: 'kg', price: 220 },
  { id: 2, title: 'Packaging Film', quantity: 180, unit: 'rolls', price: 95 },
  { id: 3, title: 'Chemical Resin', quantity: 90, unit: 'liters', price: 310 },
  { id: 4, title: 'Ceramic Powder', quantity: 320, unit: 'kg', price: 180 },
];

const fallbackPurchases = [
  { id: 1, vendor: 'BluePeak Components', material: 'Steel Rod', quantity: 120, total: 26400, status: 'Completed' },
  { id: 2, vendor: 'Green Valley Mills', material: 'Packaging Film', quantity: 45, total: 4275, status: 'In Transit' },
  { id: 3, vendor: 'North Star Logistics', material: 'Ceramic Powder', quantity: 80, total: 14400, status: 'Completed' },
];

const machineTelemetry = [...fallbackMachines];
let dbReady = false;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use((req, res, next) => {
  const publicPaths = ['/api/health', '/api/auth/login', '/api/telemetry/stream'];
  if (publicPaths.includes(req.path)) {
    next();
    return;
  }

  const authorization = req.headers.authorization ?? '';
  if (!authorization.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized. Please sign in to continue.' });
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();
  const payload = verifySignedToken(token);
  if (!payload) {
    res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
    return;
  }

  (req as typeof req & { user?: typeof payload }).user = payload;
  next();
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (email !== adminCredentials.email || password !== adminCredentials.password) {
    res.status(401).json({ message: 'Invalid admin credentials.' });
    return;
  }

  const token = createSignedToken({ email, role: adminCredentials.role, iat: Date.now() });
  res.json({
    token,
    user: { name: 'Factory Admin', email, role: adminCredentials.role },
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = (req as typeof req & { user?: { email?: string; role?: string } }).user;
  if (!user?.email || !user?.role) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  res.json({ user: { email: user.email, role: user.role, name: 'Factory Admin' } });
});

async function ensureDatabase() {
  try {
    await client.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS machines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        temperature INTEGER NOT NULL,
        efficiency INTEGER NOT NULL,
        vibration DECIMAL(4,2) NOT NULL,
        description TEXT,
        last_seen TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit VARCHAR(50) NOT NULL,
        price INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS production_runs (
        id SERIAL PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        machine_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        estimate_time VARCHAR(50) NOT NULL,
        date VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        stock INTEGER NOT NULL,
        unit VARCHAR(50) NOT NULL,
        price INTEGER NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer VARCHAR(255) NOT NULL,
        product VARCHAR(255) NOT NULL,
        total INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at VARCHAR(50) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        lead_time VARCHAR(50) NOT NULL,
        performance VARCHAR(50) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS raw_materials (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit VARCHAR(50) NOT NULL,
        price INTEGER NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        vendor VARCHAR(255) NOT NULL,
        material VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        total INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL
      );
    `);

    const insertIfEmpty = async (tableName: string, queryString: string) => {
      const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${tableName}`);
      if ((result.rows[0]?.count ?? 0) === 0) {
        await client.query(queryString);
      }
    };

    await insertIfEmpty('machines', `INSERT INTO machines (name, type, status, temperature, efficiency, vibration, description) VALUES 
      ('M-101', 'CNC Ultra', 'Running', 71, 93, 2.4, 'Precision machining for alloy housings'),
      ('M-102', 'Laser Cutter', 'Idle', 48, 81, 1.7, 'Sheet cutting and contour trimming'),
      ('M-103', 'Press Line', 'Running', 83, 87, 3.1, 'High-volume stamping operations'),
      ('M-104', 'Packaging', 'Maintenance', 58, 76, 1.5, 'Labeling and packing unit'),
      ('M-105', 'Robotic Arm', 'Running', 65, 92, 2.2, 'Assembly line handling'),
      ('M-106', 'Mixer', 'Idle', 52, 80, 1.6, 'Blend preparation for ceramic slurry')`);

    await insertIfEmpty('inventory', `INSERT INTO inventory (title, quantity, unit, price) VALUES
      ('Basmati Rice', 105, 'pieces', 1000),
      ('Weel', 30, 'pieces', 900),
      ('Soap', 9, 'pieces', 50),
      ('Shop', 0, 'pieces', 90),
      ('Lampa', 112, 'pieces', 1),
      ('Demo', 100, 'pieces', 10),
      ('Test block', 0, 'pieces', 150)`);

    await insertIfEmpty('production_runs', `INSERT INTO production_runs (product_name, machine_name, quantity, status, estimate_time, date) VALUES
      ('Soap', 'M-101', 455, 'In Progress', '12:45 HR', 'Aug 7, 2026'),
      ('Basmati Rice', 'M-102', 20, 'Pending', '11:30 HR', 'Jul 15, 2026'),
      ('Basmati Rice', 'M-103', 50, 'Completed', '10:00 HR', 'Jun 19, 2026'),
      ('Basmati Rice', 'M-104', 1, 'In Progress', '5:00 HR', 'Jun 8, 2026'),
      ('Weel', 'M-105', 10, 'Completed', '10:00 HR', 'May 7, 2026')`);

    await insertIfEmpty('customers', `INSERT INTO customers (name, email, company, status) VALUES
      ('Aarav Sharma', 'aarav@zenith.co', 'Zenith Foods', 'Active'),
      ('Pooja Verma', 'pooja@optima.ai', 'Optima AI', 'Active'),
      ('Nikhil Rao', 'nikhil@precision.in', 'Precision Works', 'VIP'),
      ('Sana Iqbal', 'sana@harbor.net', 'Harbor Supply', 'Active')`);

    await insertIfEmpty('products', `INSERT INTO products (name, category, stock, unit, price) VALUES
      ('Soap', 'Cleaning', 455, 'pieces', 120),
      ('Basmati Rice', 'Food', 215, 'kg', 85),
      ('Weel', 'Industrial', 90, 'pieces', 310),
      ('Lampa', 'Lighting', 200, 'pieces', 150)`);

    await insertIfEmpty('orders', `INSERT INTO orders (customer, product, total, status, created_at) VALUES
      ('Aarav Sharma', 'Soap', 4200, 'Paid', '2026-08-12'),
      ('Pooja Verma', 'Basmati Rice', 6600, 'Processing', '2026-08-18'),
      ('Nikhil Rao', 'Weel', 15500, 'Shipped', '2026-08-22'),
      ('Sana Iqbal', 'Lampa', 7500, 'Paid', '2026-08-27')`);

    await insertIfEmpty('vendors', `INSERT INTO vendors (name, category, lead_time, performance) VALUES
      ('North Star Logistics', 'Transport', '2 days', '98%'),
      ('Green Valley Mills', 'Raw Material', '4 days', '94%'),
      ('BluePeak Components', 'Machine Parts', '6 days', '96%'),
      ('Everlight Energy', 'Utilities', '3 days', '90%')`);

    await insertIfEmpty('raw_materials', `INSERT INTO raw_materials (title, quantity, unit, price) VALUES
      ('Steel Rod', 640, 'kg', 220),
      ('Packaging Film', 180, 'rolls', 95),
      ('Chemical Resin', 90, 'liters', 310),
      ('Ceramic Powder', 320, 'kg', 180)`);

    await insertIfEmpty('purchases', `INSERT INTO purchases (vendor, material, quantity, total, status) VALUES
      ('BluePeak Components', 'Steel Rod', 120, 26400, 'Completed'),
      ('Green Valley Mills', 'Packaging Film', 45, 4275, 'In Transit'),
      ('North Star Logistics', 'Ceramic Powder', 80, 14400, 'Completed')`);

    dbReady = true;
    console.log('Database connection active.');
  } catch (error) {
    dbReady = false;
    console.warn('Database unavailable. Running in fallback mode using simulated factory data.', error);
  }
}

function buildSummaryPayload() {
  const inventoryValue = fallbackInventory.reduce((sum, item) => sum + item.quantity, 0);
  return {
    totalOrders: fallbackOrders.length,
    totalProfit: '73K',
    totalProducts: fallbackProducts.length,
    totalCustomers: fallbackCustomers.length,
    totalInventory: inventoryValue,
    totalRawMaterials: fallbackRawMaterials.length,
    totalEmployees: 7,
    totalMachines: fallbackMachines.length,
    productionStatus: {
      pending: 1,
      inProgress: 2,
      completed: 2,
    },
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: dbReady ? 'Factory control system online with database' : 'Factory control system online in fallback mode' });
});

app.get('/api/summary', async (_req, res) => {
  if (!dbReady) {
    res.json(buildSummaryPayload());
    return;
  }

  const [machineCount, inventoryTotal, productionStatus, customerCount, productCount] = await Promise.all([
    client.query('SELECT COUNT(*)::int AS total FROM machines'),
    client.query('SELECT COALESCE(SUM(quantity), 0)::int AS total FROM inventory'),
    client.query("SELECT COUNT(*) FILTER (WHERE status = 'Pending')::int AS pending, COUNT(*) FILTER (WHERE status = 'In Progress')::int AS in_progress, COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed FROM production_runs"),
    client.query('SELECT COUNT(*)::int AS total FROM customers'),
    client.query('SELECT COUNT(*)::int AS total FROM products'),
  ]);

  res.json({
    totalOrders: 48,
    totalProfit: '73K',
    totalProducts: Number(productCount.rows[0]?.total ?? 0),
    totalCustomers: Number(customerCount.rows[0]?.total ?? 0),
    totalInventory: Number(inventoryTotal.rows[0]?.total ?? 0),
    totalRawMaterials: 7,
    totalEmployees: 7,
    totalMachines: Number(machineCount.rows[0]?.total ?? 0),
    productionStatus: {
      pending: Number(productionStatus.rows[0]?.pending ?? 0),
      inProgress: Number(productionStatus.rows[0]?.in_progress ?? 0),
      completed: Number(productionStatus.rows[0]?.completed ?? 0),
    },
  });
});

app.get('/api/machines', async (_req, res) => {
  if (!dbReady) {
    res.json(fallbackMachines);
    return;
  }
  const result = await client.query('SELECT * FROM machines ORDER BY id');
  res.json(result.rows);
});

app.get('/api/inventory', async (_req, res) => {
  if (!dbReady) {
    res.json(fallbackInventory);
    return;
  }
  const result = await client.query('SELECT * FROM inventory ORDER BY id');
  res.json(result.rows);
});

app.get('/api/production', async (_req, res) => {
  if (!dbReady) {
    res.json(fallbackProduction);
    return;
  }
  const result = await client.query('SELECT * FROM production_runs ORDER BY id');
  res.json(result.rows);
});

app.get('/api/customers', async (_req, res) => {
  if (!dbReady) {
    res.json(fallbackCustomers);
    return;
  }
  const result = await client.query('SELECT * FROM customers ORDER BY id');
  res.json(result.rows);
});

app.get('/api/products', async (_req, res) => {
  if (!dbReady) {
    res.json(fallbackProducts);
    return;
  }
  const result = await client.query('SELECT * FROM products ORDER BY id');
  res.json(result.rows);
});

app.get('/api/orders', async (_req, res) => {
  if (!dbReady) {
    res.json(fallbackOrders);
    return;
  }
  const result = await client.query('SELECT * FROM orders ORDER BY id');
  res.json(result.rows);
});

app.get('/api/vendors', async (_req, res) => {
  if (!dbReady) {
    res.json(fallbackVendors);
    return;
  }
  const result = await client.query('SELECT * FROM vendors ORDER BY id');
  res.json(result.rows);
});

app.get('/api/raw-materials', async (_req, res) => {
  if (!dbReady) {
    res.json(fallbackRawMaterials);
    return;
  }
  const result = await client.query('SELECT * FROM raw_materials ORDER BY id');
  res.json(result.rows);
});

app.get('/api/purchases', async (_req, res) => {
  if (!dbReady) {
    res.json(fallbackPurchases);
    return;
  }
  const result = await client.query('SELECT * FROM purchases ORDER BY id');
  res.json(result.rows);
});

async function askOllama(prompt: string) {
  try {
    const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        stream: false,
        prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const result = (await response.json()) as { response?: string };
    return result.response?.trim() || 'No AI insight available yet.';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return `Local AI is unavailable (${message}). Using default production recommendations: prioritize machine M-104 maintenance, accelerate the next customer order batch, and verify vendor deliveries for packaging and steel inputs.`;
  }
}

app.get('/api/ai-insight', async (_req, res) => {
  const insight = await askOllama(
    'You are a factory operations AI. Give a concise insight covering machine health, supplier risk, inventory pressure, and the next best action for an industrial dashboard.'
  );
  res.json({ insight });
});

app.get('/api/telemetry/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (payload: unknown) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  send({ type: 'snapshot', machines: machineTelemetry });

  const timer = setInterval(() => {
    machineTelemetry.forEach((entry) => {
      const jitter = (Math.random() - 0.5) * 8;
      entry.temperature = Math.max(40, Math.min(95, Math.round(entry.temperature + jitter)));
      entry.efficiency = Math.max(60, Math.min(99, Math.round(entry.efficiency + (Math.random() - 0.5) * 4)));
      entry.vibration = Number((entry.vibration + (Math.random() - 0.5) * 0.7).toFixed(2));
    });

    send({ type: 'update', machines: machineTelemetry });
  }, 4000);

  req.on('close', () => {
    clearInterval(timer);
  });
});

async function startServer() {
  await ensureDatabase();
  app.listen(port, () => {
    console.log(`SmartPlant API running on http://localhost:${port}`);
  });
}

startServer();

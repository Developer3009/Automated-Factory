import { useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  Building2,
  CircleDollarSign,
  Cpu,
  Factory,
  Gauge,
  Home,
  Package,
  ReceiptText,
  Search,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Truck,
  UserRound,
  Warehouse,
  Wrench,
} from 'lucide-react';
import './App.css';

type Status = 'Running' | 'Idle' | 'Maintenance' | 'Completed' | 'Pending' | 'In Progress';

type Summary = {
  totalOrders: number;
  totalProfit: string;
  totalProducts: number;
  totalCustomers: number;
  totalInventory: number;
  totalRawMaterials: number;
  totalEmployees: number;
  totalMachines: number;
  productionStatus: {
    pending: number;
    inProgress: number;
    completed: number;
  };
};

type Machine = {
  id: number;
  name: string;
  type: string;
  status: Status;
  temperature: number;
  efficiency: number;
  vibration: number;
  description: string;
};

type Product = {
  id: number;
  name: string;
  category: string;
  stock: number;
  unit: string;
  price: number;
};

type Customer = {
  id: number;
  name: string;
  email: string;
  company: string;
  status: string;
};

type Order = {
  id: number;
  customer: string;
  product: string;
  total: number;
  status: string;
  createdAt: string;
};

type Vendor = {
  id: number;
  name: string;
  category: string;
  leadTime: string;
  performance: string;
};

type RawMaterial = {
  id: number;
  title: string;
  quantity: number;
  unit: string;
  price: number;
};

type Purchase = {
  id: number;
  vendor: string;
  material: string;
  quantity: number;
  total: number;
  status: string;
};

type Production = {
  id: number;
  product_name: string;
  machine_name: string;
  quantity: number;
  status: Status;
  estimate_time: string;
  date: string;
};

type InventoryItem = {
  id: number;
  title: string;
  quantity: number;
  unit: string;
  price: number;
};

const navItems = [
  { label: 'Dashboard', value: 'dashboard', icon: Home },
  { label: 'Machines', value: 'machines', icon: Factory },
  { label: 'Inventory', value: 'inventory', icon: Warehouse },
  { label: 'Production', value: 'production', icon: Gauge },
  { label: 'Customers', value: 'customers', icon: UserRound },
  { label: 'Products', value: 'products', icon: Package },
  { label: 'Orders', value: 'orders', icon: ShoppingCart },
  { label: 'Vendors', value: 'vendors', icon: Truck },
  { label: 'Raw Materials', value: 'raw-materials', icon: Boxes },
  { label: 'Purchase', value: 'purchase', icon: ReceiptText },
  { label: 'AI Insights', value: 'ai', icon: Cpu },
];

const formatStatus = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('run') || normalized === 'active') return 'Running';
  if (normalized.includes('maint')) return 'Maintenance';
  if (normalized.includes('idle')) return 'Idle';
  if (normalized.includes('progres')) return 'In Progress';
  if (normalized.includes('pend')) return 'Pending';
  return 'Completed';
};

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [token, setToken] = useState<string | null>(() => window.localStorage.getItem('smartplant_token'));
  const [authUser, setAuthUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loginForm, setLoginForm] = useState({ email: 'admin@smartplant.local', password: 'SmartPlant@2026' });
  const [loginError, setLoginError] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [production, setProduction] = useState<Production[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [aiInsight, setAiInsight] = useState('Loading AI insight...');

  useEffect(() => {
    if (!token) {
      setAuthUser(null);
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Invalid token');
        }

        const data = (await response.json()) as { user: { name: string; email: string; role: string } };
        setAuthUser(data.user);
      } catch {
        setToken(null);
        setAuthUser(null);
        window.localStorage.removeItem('smartplant_token');
      }
    };

    void loadProfile();
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [summaryRes, machineRes, productionRes, inventoryRes, customersRes, productsRes, ordersRes, vendorsRes, rawMaterialsRes, purchasesRes, aiRes] = await Promise.all([
          fetch('/api/summary', { headers }),
          fetch('/api/machines', { headers }),
          fetch('/api/production', { headers }),
          fetch('/api/inventory', { headers }),
          fetch('/api/customers', { headers }),
          fetch('/api/products', { headers }),
          fetch('/api/orders', { headers }),
          fetch('/api/vendors', { headers }),
          fetch('/api/raw-materials', { headers }),
          fetch('/api/purchases', { headers }),
          fetch('/api/ai-insight', { headers }),
        ]);

        const summaryData = (await summaryRes.json()) as Summary;
        const machineData = (await machineRes.json()) as Machine[];
        const productionData = (await productionRes.json()) as Production[];
        const inventoryData = (await inventoryRes.json()) as InventoryItem[];
        const customerData = (await customersRes.json()) as Customer[];
        const productData = (await productsRes.json()) as Product[];
        const orderData = (await ordersRes.json()) as Order[];
        const vendorData = (await vendorsRes.json()) as Vendor[];
        const rawMaterialData = (await rawMaterialsRes.json()) as RawMaterial[];
        const purchaseData = (await purchasesRes.json()) as Purchase[];
        const aiData = (await aiRes.json()) as { insight: string };

        setSummary(summaryData);
        setMachines(machineData.map((item) => ({ ...item, status: formatStatus(String(item.status)) })));
        setProduction(productionData.map((item) => ({ ...item, status: formatStatus(String(item.status)) })));
        setInventory(inventoryData);
        setCustomers(customerData);
        setProducts(productData);
        setOrders(orderData);
        setVendors(vendorData);
        setRawMaterials(rawMaterialData);
        setPurchases(purchaseData);
        setAiInsight(aiData.insight || 'AI insight unavailable');
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      }
    };

    void loadData();

    const eventSource = new EventSource('http://localhost:4000/api/telemetry/stream');
    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data) as { type?: string; machines?: Machine[] };
      if (message.machines) {
        setMachines(message.machines.map((item) => ({ ...item, status: formatStatus(String(item.status)) })));
      }
    };

    return () => eventSource.close();
  }, [token]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = (await response.json()) as { token?: string; message?: string };
      if (!response.ok || !data.token) {
        throw new Error(data.message ?? 'Login failed');
      }

      setToken(data.token);
      window.localStorage.setItem('smartplant_token', data.token);
      setLoginForm({ email: 'admin@smartplant.local', password: 'SmartPlant@2026' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in';
      setLoginError(message);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setAuthUser(null);
    window.localStorage.removeItem('smartplant_token');
  };

  const cards = useMemo(() => {
    if (!summary) return [];

    return [
      { label: 'Total Orders', value: summary.totalOrders, icon: Building2, color: '#1cc68a' },
      { label: 'Total Profit', value: summary.totalProfit, icon: CircleDollarSign, color: '#f5a659' },
      { label: 'Total Products', value: summary.totalProducts, icon: Boxes, color: '#8f62ff' },
      { label: 'Total Customers', value: summary.totalCustomers, icon: TrendingUp, color: '#3db6f4' },
      { label: 'Total Inventory', value: summary.totalInventory, icon: Warehouse, color: '#ef4d67' },
      { label: 'Total Raw Materials', value: summary.totalRawMaterials, icon: Boxes, color: '#a86ef8' },
      { label: 'Total Employees', value: summary.totalEmployees, icon: ShieldCheck, color: '#3fb9ff' },
      { label: 'Total Machines', value: summary.totalMachines, icon: Wrench, color: '#1a1d23' },
    ];
  }, [summary]);

  const renderDashboard = () => (
    <>
      <div className="stats-grid">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="icon-wrap" style={{ background: color }}>
              <Icon size={24} />
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="overview-panel">
        <div className="panel-header">
          <h2>Today's Production Overview</h2>
          <button type="button" className="primary-button">Print Production</button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Machine Name</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Estimate Time</th>
              </tr>
            </thead>
            <tbody>
              {production.length ? (
                production.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td>{item.machine_name}</td>
                    <td>{item.quantity}</td>
                    <td>
                      <span className={`status-pill ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.estimate_time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>No pending or in-progress productions today.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="production-status-box">
          <div className="status-title">Production Status</div>
          <div className="status-count">
            {summary ? summary.productionStatus.pending + summary.productionStatus.inProgress + summary.productionStatus.completed : 0}
          </div>
          <div className="legend-row">
            <span><i className="dot yellow" /> Pending: {summary?.productionStatus.pending ?? 0}%</span>
            <span><i className="dot blue" /> In Progress: {summary?.productionStatus.inProgress ?? 0}%</span>
            <span><i className="dot green" /> Completed: {summary?.productionStatus.completed ?? 0}%</span>
          </div>
        </div>
      </div>
    </>
  );

  const renderMachines = () => (
    <div className="content-panel">
      <div className="toolbar">
        <button type="button" className="export-button">Export</button>
        <div className="search-mini">
          <Search size={16} />
          <input type="text" placeholder="Search..." />
        </div>
      </div>
      <div className="table-wrap no-top-gap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Machine Details</th>
              <th>Description</th>
              <th>Machine Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((machine) => (
              <tr key={machine.id}>
                <td>{machine.id}</td>
                <td>{machine.name}</td>
                <td>{machine.description}</td>
                <td>{machine.type}</td>
                <td>
                  <span className={`status-pill ${String(machine.status).toLowerCase().replace(/\s+/g, '-')}`}>
                    {machine.status}
                  </span>
                </td>
                <td><button type="button" className="action-button">◉</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="content-panel">
      <div className="tab-header-row">
        <span className="tab-title">Dashboard / Inventory</span>
      </div>
      <div className="toolbar inventory-toolbar">
        <button type="button" className="export-button">Export</button>
        <div className="search-mini">
          <Search size={16} />
          <input type="text" placeholder="Search..." />
        </div>
      </div>
      <div className="table-wrap no-top-gap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.title}</td>
                <td>{item.quantity}</td>
                <td>{item.unit}</td>
                <td>₹{item.price}</td>
                <td><button type="button" className="action-button">◉</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProduction = () => (
    <div className="content-panel">
      <div className="tab-header-row">
        <span className="tab-title">Dashboard / Production</span>
      </div>
      <div className="toolbar">
        <button type="button" className="export-button">Export</button>
        <div className="search-mini">
          <Search size={16} />
          <input type="text" placeholder="Search..." />
        </div>
      </div>
      <div className="table-wrap no-top-gap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product Details</th>
              <th>Quantity</th>
              <th>Machine Details</th>
              <th>Estimate Time</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {production.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.product_name}</td>
                <td>{item.quantity}</td>
                <td>{item.machine_name}</td>
                <td>{item.estimate_time}</td>
                <td>{item.date}</td>
                <td>
                  <span className={`status-pill ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {item.status}
                  </span>
                </td>
                <td><button type="button" className="action-button">◉</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="content-panel">
      <div className="tab-header-row"><span className="tab-title">Dashboard / Customers</span></div>
      <div className="toolbar">
        <button type="button" className="export-button">Export</button>
        <div className="search-mini"><Search size={16} /><input type="text" placeholder="Search..." /></div>
      </div>
      <div className="table-wrap no-top-gap">
        <table>
          <thead>
            <tr><th>#</th><th>Name</th><th>Email</th><th>Company</th><th>Status</th></tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.company}</td>
                <td><span className="status-pill running">{customer.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="content-panel">
      <div className="tab-header-row"><span className="tab-title">Dashboard / Products</span></div>
      <div className="toolbar">
        <button type="button" className="export-button">Export</button>
        <div className="search-mini"><Search size={16} /><input type="text" placeholder="Search..." /></div>
      </div>
      <div className="table-wrap no-top-gap">
        <table>
          <thead>
            <tr><th>#</th><th>Name</th><th>Category</th><th>Stock</th><th>Unit</th><th>Price</th></tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{product.stock}</td>
                <td>{product.unit}</td>
                <td>₹{product.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="content-panel">
      <div className="tab-header-row"><span className="tab-title">Dashboard / Orders</span></div>
      <div className="toolbar">
        <button type="button" className="export-button">Export</button>
        <div className="search-mini"><Search size={16} /><input type="text" placeholder="Search..." /></div>
      </div>
      <div className="table-wrap no-top-gap">
        <table>
          <thead>
            <tr><th>#</th><th>Customer</th><th>Product</th><th>Total</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.product}</td>
                <td>₹{order.total}</td>
                <td><span className="status-pill running">{order.status}</span></td>
                <td>{order.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderVendors = () => (
    <div className="content-panel">
      <div className="tab-header-row"><span className="tab-title">Dashboard / Vendors</span></div>
      <div className="toolbar">
        <button type="button" className="export-button">Export</button>
        <div className="search-mini"><Search size={16} /><input type="text" placeholder="Search..." /></div>
      </div>
      <div className="table-wrap no-top-gap">
        <table>
          <thead>
            <tr><th>#</th><th>Name</th><th>Category</th><th>Lead Time</th><th>Performance</th></tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id}>
                <td>{vendor.id}</td>
                <td>{vendor.name}</td>
                <td>{vendor.category}</td>
                <td>{vendor.leadTime}</td>
                <td>{vendor.performance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRawMaterials = () => (
    <div className="content-panel">
      <div className="tab-header-row"><span className="tab-title">Dashboard / Raw Materials</span></div>
      <div className="toolbar">
        <button type="button" className="export-button">Export</button>
        <div className="search-mini"><Search size={16} /><input type="text" placeholder="Search..." /></div>
      </div>
      <div className="table-wrap no-top-gap">
        <table>
          <thead>
            <tr><th>#</th><th>Material</th><th>Quantity</th><th>Unit</th><th>Price</th></tr>
          </thead>
          <tbody>
            {rawMaterials.map((material) => (
              <tr key={material.id}>
                <td>{material.id}</td>
                <td>{material.title}</td>
                <td>{material.quantity}</td>
                <td>{material.unit}</td>
                <td>₹{material.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPurchase = () => (
    <div className="content-panel">
      <div className="tab-header-row"><span className="tab-title">Dashboard / Purchase</span></div>
      <div className="toolbar">
        <button type="button" className="export-button">Export</button>
        <div className="search-mini"><Search size={16} /><input type="text" placeholder="Search..." /></div>
      </div>
      <div className="table-wrap no-top-gap">
        <table>
          <thead>
            <tr><th>#</th><th>Vendor</th><th>Material</th><th>Quantity</th><th>Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase.id}>
                <td>{purchase.id}</td>
                <td>{purchase.vendor}</td>
                <td>{purchase.material}</td>
                <td>{purchase.quantity}</td>
                <td>₹{purchase.total}</td>
                <td><span className="status-pill running">{purchase.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAi = () => (
    <div className="content-panel ai-panel">
      <h2>AI Operations Forecast</h2>
      <div className="ai-box">
        <p>{aiInsight}</p>
      </div>
    </div>
  );

  if (!token) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <div className="brand-row login-brand">
            <div className="brand-mark">
              <span className="mark-grid" />
            </div>
            <div>
              <div className="brand-name">SmartPlant</div>
              <div className="brand-subtitle">Factory Admin Access</div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <label>
              <span>Email</span>
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="admin@smartplant.local"
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Enter password"
              />
            </label>
            {loginError ? <div className="login-error">{loginError}</div> : null}
            <button type="submit" className="primary-button">Sign in</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">
            <span className="mark-grid" />
          </div>
          <div>
            <div className="brand-name">SmartPlant</div>
            <div className="brand-subtitle">Factory Management System</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">Main Menu</div>
          {navItems.map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              className={`nav-item ${activeView === value ? 'active' : ''}`}
              onClick={() => setActiveView(value)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1>Dashboard</h1>
            <div className="subtitle">FMS Admin Dashboard Solution</div>
          </div>

          <div className="top-actions">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder="Search" />
            </div>
            <button type="button" className="icon-round">◐</button>
            <button type="button" className="icon-round">☾</button>
            <div className="profile-pill">
              <div className="avatar">{authUser?.name?.charAt(0) ?? 'A'}</div>
              <span>{authUser?.name ?? 'Factory Admin'}</span>
              <button type="button" className="logout-button" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </header>

        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'machines' && renderMachines()}
        {activeView === 'inventory' && renderInventory()}
        {activeView === 'production' && renderProduction()}
        {activeView === 'customers' && renderCustomers()}
        {activeView === 'products' && renderProducts()}
        {activeView === 'orders' && renderOrders()}
        {activeView === 'vendors' && renderVendors()}
        {activeView === 'raw-materials' && renderRawMaterials()}
        {activeView === 'purchase' && renderPurchase()}
        {activeView === 'ai' && renderAi()}
      </main>
    </div>
  );
}

export default App;

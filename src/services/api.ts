import axios from 'axios';

// Configure base API client
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://smartiventory-production.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for loading states
api.interceptors.request.use((config) => {
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Helper to map _id to id
function mapProduct(product: any): Product {
  return {
    ...product,
    id: product._id || product.id,
  };
}

function mapOrder(order: any): OrderWithProducts {
  return {
    ...order,
    id: order._id || order.id,
    items: order.items.map((item: any) => ({
      ...item,
      productId: item.productId || (item.product && (item.product._id || item.product.id)),
    })),
  };
}

// Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: string;
  items: OrderItem[];
  totalPrice: number;
  createdAt?: string;
}

export interface OrderWithProducts extends Omit<Order, 'items'> {
  items: (OrderItem & { productName: string })[];
}

// Product API calls
export const productApi = {
  getAll: async () => {
    const res = await api.get<any[]>('/products');
    return { ...res, data: res.data.map(mapProduct) };
  },
  getById: async (id: string) => {
    const res = await api.get<any>(`/products/${id}`);
    return { ...res, data: mapProduct(res.data) };
  },
  create: async (product: Omit<Product, 'id'>) => {
    const res = await api.post<any>('/products', product);
    return { ...res, data: mapProduct(res.data) };
  },
  update: async (id: string, product: Partial<Product>) => {
    const res = await api.put<any>(`/products/${id}`, product);
    return { ...res, data: mapProduct(res.data) };
  },
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Order API calls
export const orderApi = {
  getAll: async () => {
    const res = await api.get<any[]>('/orders');
    return { ...res, data: res.data.map(mapOrder) };
  },
  getById: async (id: string) => {
    const res = await api.get<any>(`/orders/${id}`);
    return { ...res, data: mapOrder(res.data) };
  },
  create: (order: Omit<Order, 'id'>) => api.post<Order>('/orders', order),
};

// Dashboard API calls
export const dashboardApi = {
  getStats: async () => {
    const [productsRes, ordersRes] = await Promise.all([
      productApi.getAll(),
      orderApi.getAll(),
    ]);
    
    const products = productsRes.data;
    const orders = ordersRes.data;
    
    const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold);
    
    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      lowStockCount: lowStockProducts.length,
      recentOrders: orders.slice(0, 5),
      lowStockProducts,
    };
  },
};

export default api;
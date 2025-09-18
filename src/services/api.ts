import axios from 'axios';

// Configure base API client
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:3000/api',
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

// Types
export interface Product {
  id?: string;
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
  getAll: () => api.get<Product[]>('/products'),
  getById: (id: string) => api.get<Product>(`/products/${id}`),
  create: (product: Omit<Product, 'id'>) => api.post<Product>('/products', product),
  update: (id: string, product: Partial<Product>) => api.put<Product>(`/products/${id}`, product),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Order API calls
export const orderApi = {
  getAll: () => api.get<OrderWithProducts[]>('/orders'),
  getById: (id: string) => api.get<OrderWithProducts>(`/orders/${id}`),
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
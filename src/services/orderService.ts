import { Product } from "../types";

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  shippingAddress: string;
  supplierId?: string;
  externalOrderId?: string;
  trackingNumber?: string;
}

// Mock supplier API integration (Alibaba/CJ Dropshipping logic)
class SupplierService {
  private suppliers = [
    { id: 'ali_01', name: 'Alibaba Global', type: 'wholesale' },
    { id: 'cj_01', name: 'CJ Dropshipping', type: 'dropshipping' },
    { id: 'local_01', name: 'Artisanat Kananga', type: 'local' }
  ];

  /**
   * Simulates finding products from a supplier API
   */
  async sourceProduct(query: string): Promise<any[]> {
    console.log(`Searching suppliers for: ${query}`);
    // In a real app, this would hit Alibaba/CJ APIs
    return [
      { id: 'ext_1', name: query + ' Pro', supplier: 'Alibaba', price: 15.50, stock: 500 },
      { id: 'ext_2', name: query + ' Lite', supplier: 'CJ Dropshipping', price: 8.20, stock: 1200 },
    ];
  }

  /**
   * Simulates placing an order with a supplier
   */
  async placeExternalOrder(order: Order): Promise<{ externalId: string, status: string }> {
    console.log(`Syncing order ${order.id} with supplier ${order.supplierId}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          externalId: 'SUB-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          status: 'confirmed'
        });
      }, 2000);
    });
  }

  /**
   * Simulates fetching tracking info from supplier
   */
  async getTrackingInfo(externalOrderId: string): Promise<{ status: string, location: string, trackingNum: string }> {
    return {
      status: 'In Transit',
      location: 'Sorting Hub, Paris',
      trackingNum: 'TRK-' + externalOrderId.split('-')[1]
    };
  }
}

export const supplierService = new SupplierService();

// Local Order Manager
class OrderManager {
  private orders: Order[] = [
    {
      id: 'ELADMA-9928',
      customerId: 'user_1',
      customerName: 'Lazar L.',
      items: [{ productId: '1', name: 'Smartphone Eladma Elite', quantity: 1, price: 799.99 }],
      total: 799.99,
      status: 'delivered',
      date: '2026-04-20',
      shippingAddress: 'Kananga, Ngaza, RDC'
    }
  ];

  getOrders(): Order[] {
    return this.orders;
  }

  getSupplierOrders(supplierId: string): Order[] {
    return this.orders.filter(o => o.supplierId === supplierId);
  }

  createOrder(orderData: Omit<Order, 'id' | 'date'>): Order {
    const newOrder: Order = {
      ...orderData,
      id: 'ELADMA-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().split('T')[0],
    };
    this.orders.unshift(newOrder);
    return newOrder;
  }

  async fulfillOrder(orderId: string, supplierId: string): Promise<Order> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");

    order.status = 'processing';
    order.supplierId = supplierId;

    const result = await supplierService.placeExternalOrder(order);
    order.externalOrderId = result.externalId;
    order.status = 'shipped';
    order.trackingNumber = 'TRK' + Math.random().toString().substr(2, 8);

    return order;
  }

  updateOrderStatus(orderId: string, status: Order['status']): void {
    const index = this.orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      this.orders[index].status = status;
    }
  }
}

export const orderManager = new OrderManager();

import { Product } from "../types";
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

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

  private listeners: Set<(orders: Order[]) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const ordersRef = collection(db, 'orders');
        // Install dynamic subscription to keep orders synced in real-time
        onSnapshot(ordersRef, (snapshot) => {
          const cloudOrders: Order[] = [];
          snapshot.forEach((doc) => {
            cloudOrders.push(doc.data() as Order);
          });
          
          if (cloudOrders.length > 0) {
            // Sort by date descending
            cloudOrders.sort((a, b) => b.id.localeCompare(a.id));
            this.orders = cloudOrders;
          } else {
            // Seed default order to firestore if database is clean
            const defaultOrder = this.orders[0];
            if (defaultOrder) {
              setDoc(doc(db, 'orders', defaultOrder.id), defaultOrder)
                .catch((err) => handleFirestoreError(err, OperationType.WRITE, `orders/${defaultOrder.id}`));
            }
          }
          this.notify();
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'orders');
        });
      } catch (err) {
        console.error("Error setting up real-time orders cloud sync:", err);
      }
    }
  }

  subscribe(listener: (orders: Order[]) => void): () => void {
    this.listeners.add(listener);
    // Flush current state immediately on subscription
    listener([...this.orders]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.orders]);
      } catch (e) {
        console.error("Error invoking order change listener:", e);
      }
    });
  }

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
    
    // Optimistic local update
    this.orders = [newOrder, ...this.orders.filter(o => o.id !== newOrder.id)];
    this.notify();

    // Async write to Cloud Firestore
    setDoc(doc(db, 'orders', newOrder.id), newOrder)
      .then(() => console.log(`Order ${newOrder.id} successfully saved to Cloud!`))
      .catch((err) => handleFirestoreError(err, OperationType.WRITE, `orders/${newOrder.id}`));

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

    // Save update to cloud
    try {
      await setDoc(doc(db, 'orders', order.id), order);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${order.id}`);
    }
    this.notify();

    return order;
  }

  updateOrderStatus(orderId: string, status: Order['status']): void {
    const index = this.orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      this.orders[index].status = status;
      this.notify();

      // Async update in cloud
      setDoc(doc(db, 'orders', orderId), this.orders[index])
        .then(() => console.log(`Order status updated to ${status} in cloud`))
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`));
    }
  }
}

export const orderManager = new OrderManager();

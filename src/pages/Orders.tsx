import { useEffect, useState } from "react";
import { Plus, ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productApi, orderApi, Product, OrderWithProducts, OrderItem } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface OrderFormItem {
  productId: string;
  productName: string;
  price: number;
  availableStock: number;
  quantity: number;
}

export default function Orders() {
  const [orders, setOrders] = useState<OrderWithProducts[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderFormItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderApi.getAll();
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setOrderItems([{ productId: "", productName: "", price: 0, availableStock: 0, quantity: 1 }]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setOrderItems([]);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: "", productName: "", price: 0, availableStock: 0, quantity: 1 }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: keyof OrderFormItem, value: any) => {
    const updatedItems = [...orderItems];
    
    if (field === "productId") {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        updatedItems[index] = {
          ...updatedItems[index],
          productId: value,
          productName: selectedProduct.name,
          price: selectedProduct.price,
          availableStock: selectedProduct.stock,
          quantity: Math.min(updatedItems[index].quantity, selectedProduct.stock),
        };
      }
    } else {
      updatedItems[index] = { ...updatedItems[index], [field]: value };
    }
    
    setOrderItems(updatedItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const validateOrder = () => {
    for (const item of orderItems) {
      if (!item.productId) {
        toast({
          title: "Error",
          description: "Please select a product for all items.",
          variant: "destructive",
        });
        return false;
      }
      if (item.quantity > item.availableStock) {
        toast({
          title: "Error",
          description: `Not enough stock for ${item.productName}. Available: ${item.availableStock}`,
          variant: "destructive",
        });
        return false;
      }
      if (item.quantity <= 0) {
        toast({
          title: "Error",
          description: "Quantity must be greater than 0.",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmitOrder = async () => {
    if (!validateOrder()) return;

    const orderData = {
      items: orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })) as OrderItem[],
      totalPrice: calculateTotal(),
    };

    try {
      await orderApi.create(orderData);
      toast({
        title: "Success",
        description: "Order placed successfully!",
      });
      handleCloseModal();
      fetchOrders();
      fetchProducts(); // Refresh to get updated stock levels
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const availableProducts = (currentProductId?: string) => {
    const selectedProductIds = orderItems
      .map(item => item.productId)
      .filter(id => id && id !== currentProductId);
    
    return products.filter(product => 
      product.stock > 0 && 
      !selectedProductIds.includes(product.id!)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Create and manage your orders</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenModal} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Order Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Order Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addOrderItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                {orderItems.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor={`product-${index}`}>Product</Label>
                        <Select
                          value={item.productId}
                          onValueChange={(value) => updateOrderItem(index, "productId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProducts(item.productId).map((product) => (
                              <SelectItem key={product.id} value={product.id!}>
                                {product.name} - ${product.price.toFixed(2)} (Stock: {product.stock})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          max={item.availableStock}
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(index, "quantity", parseInt(e.target.value) || 1)}
                        />
                        {item.availableStock > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Max: {item.availableStock}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-end">
                        <div className="flex-1">
                          <Label>Subtotal</Label>
                          <p className="text-lg font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        {orderItems.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOrderItem(index)}
                            className="text-destructive hover:text-destructive ml-2"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              {/* Order Summary */}
              <Card className="p-4 bg-muted/50">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </Card>
              
              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitOrder}
                  disabled={orderItems.some(item => !item.productId) || calculateTotal() === 0}
                >
                  Place Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Orders History */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found. Create your first order to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="table-row">
                    <TableCell>
                      <span className="font-medium">#{order.id?.slice(-8)}</span>
                    </TableCell>
                    <TableCell>
                      {order.createdAt && formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{item.productName}</span>
                            <span className="text-muted-foreground"> × {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-success">
                        ${typeof order.totalPrice === "number" ? order.totalPrice.toFixed(2) : "0.00"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Completed</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
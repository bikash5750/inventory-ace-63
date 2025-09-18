import { useEffect, useState } from "react";
import { AlertTriangle, Package, Plus } from "lucide-react";
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
import { productApi, Product } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function LowStock() {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getAll();
      const allProducts = response.data;
      const filtered = allProducts.filter(product => 
        product.stock <= product.lowStockThreshold
      );
      setLowStockProducts(filtered);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      toast({
        title: "Error",
        description: "Failed to load low stock products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setNewStock(product.stock.toString());
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setNewStock("");
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !newStock) {
      toast({
        title: "Error",
        description: "Please enter a valid stock amount.",
        variant: "destructive",
      });
      return;
    }

    const stockValue = parseInt(newStock);
    if (stockValue < 0) {
      toast({
        title: "Error",
        description: "Stock cannot be negative.",
        variant: "destructive",
      });
      return;
    }

    try {
      await productApi.update(selectedProduct.id!, { stock: stockValue });
      toast({
        title: "Success",
        description: `Stock updated for ${selectedProduct.name}.`,
      });
      handleCloseModal();
      fetchLowStockProducts();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (product.stock <= product.lowStockThreshold) return { label: "Low Stock", variant: "destructive" as const };
    return { label: "In Stock", variant: "secondary" as const };
  };

  const getUrgencyLevel = (product: Product) => {
    if (product.stock === 0) return "critical";
    if (product.stock <= Math.floor(product.lowStockThreshold * 0.5)) return "high";
    return "medium";
  };

  const urgencyColors = {
    critical: "border-l-4 border-l-red-500 bg-red-50/50",
    high: "border-l-4 border-l-orange-500 bg-orange-50/50",
    medium: "border-l-4 border-l-yellow-500 bg-yellow-50/50",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            Low Stock Alerts
          </h1>
          <p className="text-muted-foreground">Products that need immediate attention</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical (Out of Stock)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {lowStockProducts.filter(p => p.stock === 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Immediate restocking needed
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High Priority
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {lowStockProducts.filter(p => p.stock > 0 && p.stock <= Math.floor(p.lowStockThreshold * 0.5)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Very low stock levels
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Alerts
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {lowStockProducts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Products below threshold
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Products */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Products Requiring Attention</CardTitle>
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
          ) : lowStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-success mb-2">All Good!</h3>
              <p className="text-muted-foreground">
                All products are well stocked. No immediate action needed.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts
                  .sort((a, b) => {
                    // Sort by urgency: critical first, then high, then medium
                    const urgencyOrder = { critical: 0, high: 1, medium: 2 };
                    return urgencyOrder[getUrgencyLevel(a)] - urgencyOrder[getUrgencyLevel(b)];
                  })
                  .map((product) => {
                    const urgency = getUrgencyLevel(product);
                    const status = getStockStatus(product);
                    
                    return (
                      <TableRow 
                        key={product.id} 
                        className={`table-row ${urgencyColors[urgency]}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <AlertTriangle 
                              className={`h-4 w-4 ${
                                urgency === 'critical' ? 'text-red-500' :
                                urgency === 'high' ? 'text-orange-500' : 'text-yellow-500'
                              }`} 
                            />
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.description && (
                                <p className="text-sm text-muted-foreground">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            product.stock === 0 ? 'text-red-500' : 'text-orange-500'
                          }`}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell>{product.lowStockThreshold}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              urgency === 'critical' ? 'border-red-500 text-red-700' :
                              urgency === 'high' ? 'border-orange-500 text-orange-700' :
                              'border-yellow-500 text-yellow-700'
                            }
                          >
                            {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenModal(product)}
                                className="gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Update Stock
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Update Stock - {selectedProduct?.name}</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleUpdateStock} className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="current-stock">Current Stock</Label>
                                  <Input
                                    id="current-stock"
                                    value={selectedProduct?.stock || 0}
                                    disabled
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="new-stock">New Stock Amount *</Label>
                                  <Input
                                    id="new-stock"
                                    type="number"
                                    min="0"
                                    value={newStock}
                                    onChange={(e) => setNewStock(e.target.value)}
                                    placeholder="Enter new stock amount"
                                    required
                                  />
                                </div>
                                
                                <div className="bg-muted p-3 rounded-lg">
                                  <p className="text-sm">
                                    <strong>Threshold:</strong> {selectedProduct?.lowStockThreshold}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Recommended: Add at least {selectedProduct && (selectedProduct.lowStockThreshold * 2)} units
                                  </p>
                                </div>
                                
                                <div className="flex justify-end gap-2 pt-4">
                                  <Button type="button" variant="outline" onClick={handleCloseModal}>
                                    Cancel
                                  </Button>
                                  <Button type="submit">
                                    Update Stock
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
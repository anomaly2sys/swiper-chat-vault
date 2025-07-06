import React, { useState } from "react";
import {
  ShoppingCart,
  Plus,
  Bitcoin,
  Package,
  DollarSign,
  MessageSquare,
  Crown,
  Star,
  Image as ImageIcon,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Product, Ticket } from "@/types/channels";

interface ShopSystemProps {
  serverId: string;
  products: Product[];
  userRole: "owner" | "moderator" | "member";
  onCreateProduct?: (product: Omit<Product, "id" | "createdAt">) => void;
  onUpdateProduct?: (productId: string, updates: Partial<Product>) => void;
  onDeleteProduct?: (productId: string) => void;
  onCreateTicket?: (productId: string, buyerId: string) => void;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

const ShopSystem: React.FC<ShopSystemProps> = ({
  serverId,
  products,
  userRole,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onCreateTicket,
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
  });
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const canManageProducts = userRole === "owner";

  const handleCreateProduct = () => {
    if (!canManageProducts) {
      toast({
        title: "Access denied",
        description: "Only server owners can create products",
        variant: "destructive",
      });
      return;
    }

    if (!productForm.name.trim() || productForm.price <= 0) {
      toast({
        title: "Invalid product data",
        description: "Please provide a valid name and price",
        variant: "destructive",
      });
      return;
    }

    const newProduct = {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price: productForm.price,
      imageUrl: productForm.imageUrl.trim(),
      ownerId: currentUser?.id?.toString() || "",
      isActive: true,
    };

    if (onCreateProduct) {
      onCreateProduct(newProduct);
    }

    toast({
      title: "Product created",
      description: `${newProduct.name} has been added to the shop`,
    });

    setProductForm({ name: "", description: "", price: 0, imageUrl: "" });
    setShowCreateDialog(false);
  };

  const handleBuyProduct = (product: Product) => {
    if (!currentUser) return;

    if (onCreateTicket) {
      onCreateTicket(product.id, currentUser.id.toString());
    }

    toast({
      title: "Purchase request created",
      description: `A secure ticket has been created for ${product.name}. The server owner will contact you to complete the Bitcoin transaction.`,
    });
  };

  const formatBitcoinPrice = (satoshis: number) => {
    const btc = satoshis / 100000000; // Convert satoshis to BTC
    return `₿${btc.toFixed(8)}`;
  };

  const formatUSDPrice = (satoshis: number) => {
    // Assuming 1 BTC = $40,000 USD for display purposes
    const btc = satoshis / 100000000;
    const usd = btc * 40000;
    return `~$${usd.toFixed(2)} USD`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-purple-600/20 border-b border-purple-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="h-6 w-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Shop</h2>
              <p className="text-gray-400 text-sm">
                Bitcoin payments only • Military-grade encryption
              </p>
            </div>
          </div>

          {canManageProducts && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-purple-500/30">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Create New Product
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Product Name</Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter product name"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Description</Label>
                    <Textarea
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Enter product description"
                      className="bg-gray-800 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Price (in Satoshis)</Label>
                    <Input
                      type="number"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          price: Number(e.target.value),
                        }))
                      }
                      placeholder="Price in satoshis (100,000,000 = 1 BTC)"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    {productForm.price > 0 && (
                      <div className="text-sm text-gray-400">
                        = {formatBitcoinPrice(productForm.price)} (
                        {formatUSDPrice(productForm.price)})
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">
                      Image URL (Optional)
                    </Label>
                    <Input
                      value={productForm.imageUrl}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          imageUrl: e.target.value,
                        }))
                      }
                      placeholder="https://example.com/image.jpg"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bitcoin className="h-4 w-4 text-yellow-400" />
                      <span className="text-yellow-300 font-medium text-sm">
                        Bitcoin Only
                      </span>
                    </div>
                    <p className="text-yellow-400 text-xs mt-1">
                      All payments are processed exclusively in Bitcoin through
                      secure ticket system.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                      className="border-gray-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateProduct}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Create Product
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <ScrollArea className="flex-1 p-4">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products
              .filter((p) => p.isActive)
              .map((product) => (
                <Card
                  key={product.id}
                  className="bg-gray-800/40 border-gray-700 hover:border-purple-500/50 transition-colors"
                >
                  <CardHeader className="pb-2">
                    {product.imageUrl && (
                      <div className="w-full h-32 bg-gray-700 rounded-lg mb-3 overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    <CardTitle className="text-lg text-white flex items-center justify-between">
                      <span>{product.name}</span>
                      {canManageProducts &&
                        product.ownerId === currentUser?.id?.toString() && (
                          <Crown className="h-4 w-4 text-yellow-400" />
                        )}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-gray-300 text-sm">
                      {product.description}
                    </p>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Bitcoin className="h-4 w-4 text-yellow-400" />
                        <span className="text-white font-bold">
                          {formatBitcoinPrice(product.price)}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs">
                        {formatUSDPrice(product.price)}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleBuyProduct(product)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={
                          product.ownerId === currentUser?.id?.toString()
                        }
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {product.ownerId === currentUser?.id?.toString()
                          ? "Your Product"
                          : "Buy"}
                      </Button>

                      {canManageProducts &&
                        product.ownerId === currentUser?.id?.toString() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteProduct?.(product.id)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <ShoppingCart className="h-16 w-16 mb-4 text-gray-600" />
            <h3 className="text-lg font-medium mb-2">No products available</h3>
            <p className="text-sm text-center">
              {canManageProducts
                ? "Create your first product to start selling in this server"
                : "The server owner hasn't added any products yet"}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ShopSystem;

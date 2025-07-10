import React, { useState } from "react";
import {
  ShoppingCart,
  Plus,
  Bitcoin,
  Shield,
  Star,
  Package,
  User,
  DollarSign,
  Eye,
  Heart,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in satoshis
  imageUrl?: string;
  sellerId: string;
  sellerUsername: string;
  category: string;
  stock: number;
  rating: number;
  totalSales: number;
  isActive: boolean;
  createdAt: Date;
}

interface ShopChannelViewProps {
  channelId: string;
  serverId: string;
  canManageProducts: boolean;
}

const ShopChannelView: React.FC<ShopChannelViewProps> = ({
  channelId,
  serverId,
  canManageProducts,
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([
    {
      id: "prod-1",
      name: "Premium Account Upgrade",
      description: "Unlock all premium features including advanced encryption, custom themes, and priority support.",
      price: 50000, // 0.0005 BTC in satoshis
      sellerId: "vendor-1",
      sellerUsername: "CryptoVendor",
      category: "Digital Services",
      stock: 100,
      rating: 4.8,
      totalSales: 247,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "prod-2", 
      name: "Custom Bot Development",
      description: "Professional Discord/Telegram bot development with advanced features and deployment.",
      price: 500000, // 0.005 BTC in satoshis
      sellerId: "vendor-2",
      sellerUsername: "DevMaster",
      category: "Development",
      stock: 5,
      rating: 5.0,
      totalSales: 12,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "prod-3",
      name: "Private VPN Access",
      description: "Secure, anonymous VPN access with military-grade encryption. 1-year subscription.",
      price: 100000, // 0.001 BTC in satoshis
      sellerId: "vendor-3",
      sellerUsername: "SecureProxy",
      category: "Security",
      stock: 50,
      rating: 4.6,
      totalSales: 89,
      isActive: true,
      createdAt: new Date(),
    },
  ]);

  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    imageUrl: "",
  });

  const formatBitcoin = (satoshis: number) => {
    return `₿${(satoshis / 100000000).toFixed(8)}`;
  };

  const formatUSD = (satoshis: number) => {
    // Assuming 1 BTC = $45,000 for demo
    const btc = satoshis / 100000000;
    const usd = btc * 45000;
    return `$${usd.toFixed(2)}`;
  };

  const handleCreateProduct = () => {
    if (!newProduct.name || !newProduct.description || !newProduct.price) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const product: Product = {
      id: `prod-${Date.now()}`,
      name: newProduct.name,
      description: newProduct.description,
      price: parseInt(newProduct.price),
      sellerId: String(currentUser?.id || ""),
      sellerUsername: currentUser?.username || "",
      category: newProduct.category || "Uncategorized",
      stock: parseInt(newProduct.stock) || 1,
      rating: 0,
      totalSales: 0,
      isActive: true,
      createdAt: new Date(),
      imageUrl: newProduct.imageUrl,
    };

    setProducts(prev => [...prev, product]);
    
    // Save to localStorage
    const savedProducts = JSON.parse(localStorage.getItem("swiperEmpire_products") || "[]");
    savedProducts.push(product);
    localStorage.setItem("swiperEmpire_products", JSON.stringify(savedProducts));

    toast({
      title: "Product created",
      description: "Your product has been added to the shop",
    });

    setNewProduct({
      name: "",
      description: "",
      price: "",
      category: "",
      stock: "",
      imageUrl: "",
    });
    setShowCreateProduct(false);
  };

  const handleBuyProduct = (product: Product) => {
    // Open escrow system with this product
    const escrowData = {
      productId: product.id,
      productName: product.name,
      sellerId: product.sellerId,
      sellerUsername: product.sellerUsername,
      amount: product.price,
      description: product.description,
    };
    
    // Store in localStorage to pass to escrow system
    localStorage.setItem("swiperEmpire_pendingEscrow", JSON.stringify(escrowData));
    
    toast({
      title: "🛡️ Escrow System Activated",
      description: "Opening secure escrow transaction for this product",
    });

    // You could open a modal here or navigate to escrow page
    // For now, we'll trigger the escrow system event
    window.dispatchEvent(new CustomEvent('openEscrow', { detail: escrowData }));
  };

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-xl">
      {/* Shop Header */}
      <div className="p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">SwiperEmpire Shop</h2>
              <p className="text-sm text-gray-400">Secure marketplace with escrow protection</p>
            </div>
          </div>
          
          {canManageProducts && (
            <Dialog open={showCreateProduct} onOpenChange={setShowCreateProduct}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-purple-500/30 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Product</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Product Name</Label>
                    <Input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Description</Label>
                    <Textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Describe your product"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Price (in satoshis)</Label>
                    <Input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="e.g., 50000 (0.0005 BTC)"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Category</Label>
                    <Input
                      value={newProduct.category}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="e.g., Digital Services"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Stock</Label>
                    <Input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Available quantity"
                    />
                  </div>
                  <Button
                    onClick={handleCreateProduct}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Create Product
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{product.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-purple-600 text-white text-xs">
                          {product.sellerUsername.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-400">{product.sellerUsername}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-purple-400 border-purple-500">
                    {product.category}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-gray-300 text-sm line-clamp-3">{product.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-gray-300">{product.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">{product.stock}</span>
                    </div>
                  </div>
                  <span className="text-gray-400">{product.totalSales} sold</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bitcoin className="h-5 w-5 text-orange-400" />
                      <span className="font-bold text-white">{formatBitcoin(product.price)}</span>
                    </div>
                    <span className="text-gray-400 text-sm">{formatUSD(product.price)}</span>
                  </div>
                  
                  <Button
                    onClick={() => handleBuyProduct(product)}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    disabled={product.stock === 0}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {product.stock === 0 ? "Out of Stock" : "Buy with Escrow"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Products Available</h3>
            <p className="text-gray-500">Products will appear here when vendors add them to the shop.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopChannelView;
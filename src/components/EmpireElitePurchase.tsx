import React, { useState } from "react";
import {
  Star,
  Bitcoin,
  Crown,
  Zap,
  Shield,
  CheckCircle,
  DollarSign,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import EmpireEliteBadge from "./EmpireEliteBadge";

const EmpireElitePurchase: React.FC = () => {
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [bitcoinAddress, setBitcoinAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const ELITE_PRICE_USD = 25;
  const ELITE_PRICE_BTC = 0.000625; // $25 at ~$40,000 BTC
  const ELITE_PRICE_SATOSHIS = 62500;

  const benefits = [
    {
      icon: <DollarSign className="h-5 w-5" />,
      title: "0% Transaction Fees",
      description: "Never pay platform fees on any purchases",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Priority Support",
      description: "Get premium support with faster response times",
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: "Exclusive Badge",
      description: "Show your Elite status with animated badge",
    },
    {
      icon: <Crown className="h-5 w-5" />,
      title: "VIP Access",
      description: "Access to exclusive channels and features",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Enhanced Security",
      description: "Additional security features and monitoring",
    },
    {
      icon: <Gift className="h-5 w-5" />,
      title: "Monthly Rewards",
      description: "Receive monthly Bitcoin rewards and bonuses",
    },
  ];

  const isAlreadyElite = () => {
    const userRoles = JSON.parse(
      localStorage.getItem("swiperEmpire_userRoles") || "[]",
    );
    const currentUserRoles = userRoles.find(
      (ur: any) => ur.userId === currentUser?.id,
    );
    return currentUserRoles?.roles?.includes("empire-elite") || false;
  };

  const generatePaymentAddress = () => {
    // Generate a unique Bitcoin address for this payment
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let result = "1EmpireElite";
    for (let i = 0; i < 20; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const processPurchase = async () => {
    if (!currentUser) return;

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Add Empire Elite role to user
      const userRoles = JSON.parse(
        localStorage.getItem("swiperEmpire_userRoles") || "[]",
      );
      const existingUserRole = userRoles.find(
        (ur: any) => ur.userId === currentUser.id,
      );

      if (existingUserRole) {
        if (!existingUserRole.roles.includes("empire-elite")) {
          existingUserRole.roles.unshift("empire-elite"); // Add at the beginning for priority
        }
      } else {
        const newUserRole = {
          userId: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.displayName,
          roles: ["empire-elite", "member"],
        };
        userRoles.push(newUserRole);
      }

      localStorage.setItem("swiperEmpire_userRoles", JSON.stringify(userRoles));

      // Create payment record
      const payments = JSON.parse(
        localStorage.getItem("swiperEmpire_elitePayments") || "[]",
      );
      const payment = {
        id: `payment-${Date.now()}`,
        userId: currentUser.id,
        username: currentUser.username,
        amount: ELITE_PRICE_SATOSHIS,
        address: bitcoinAddress,
        status: "completed",
        timestamp: new Date().toISOString(),
      };
      payments.push(payment);
      localStorage.setItem(
        "swiperEmpire_elitePayments",
        JSON.stringify(payments),
      );

      toast({
        title: "Welcome to Empire Elite! 🌟",
        description:
          "Your membership has been activated. Enjoy 0% fees and exclusive benefits!",
      });

      setShowPurchaseDialog(false);
      setBitcoinAddress("");

      // Refresh page to show new role
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({
        title: "Payment failed",
        description:
          "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isAlreadyElite()) {
    return (
      <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <EmpireEliteBadge size="lg" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            You're Empire Elite!
          </h3>
          <p className="text-gray-300">
            Enjoy your 0% fees and exclusive benefits
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Star className="h-6 w-6 text-purple-400" />
            <span>Upgrade to Empire Elite</span>
            <Star className="h-6 w-6 text-purple-400" />
          </div>
          <div className="flex justify-center">
            <EmpireEliteBadge size="lg" animated={true} />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pricing */}
        <div className="text-center">
          <div className="text-3xl font-bold text-white mb-2">
            ${ELITE_PRICE_USD} USD
          </div>
          <div className="text-lg text-purple-300">
            ₿{ELITE_PRICE_BTC} ({ELITE_PRICE_SATOSHIS.toLocaleString()}{" "}
            satoshis)
          </div>
          <p className="text-gray-400 text-sm mt-2">
            One-time payment • Lifetime membership
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700"
            >
              <div className="text-purple-400 mt-1">{benefit.icon}</div>
              <div>
                <h4 className="text-white font-medium text-sm">
                  {benefit.title}
                </h4>
                <p className="text-gray-400 text-xs">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Fee Comparison */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3 text-center">
            Fee Comparison
          </h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-300">7%</div>
              <div className="text-gray-400 text-sm">Regular Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-300">3%</div>
              <div className="text-gray-400 text-sm">Verified Vendors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-300">0%</div>
              <div className="text-gray-400 text-sm">Empire Elite</div>
            </div>
          </div>
          <div className="text-center mt-3">
            <p className="text-purple-300 text-sm font-medium">
              Save money on every purchase! 💰
            </p>
          </div>
        </div>

        {/* Purchase Button */}
        <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
          <DialogTrigger asChild>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3">
              <Bitcoin className="h-5 w-5 mr-2" />
              Upgrade to Empire Elite
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-black/90 border-purple-500/30 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-center">
                <EmpireEliteBadge size="lg" />
                <div className="mt-2">Complete Your Purchase</div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-white font-medium">Send exactly:</p>
                <div className="text-2xl font-bold text-purple-300">
                  ₿{ELITE_PRICE_BTC}
                </div>
                <p className="text-gray-400 text-sm">
                  ({ELITE_PRICE_SATOSHIS.toLocaleString()} satoshis)
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Payment Address</Label>
                <div className="p-3 bg-gray-800 rounded border border-gray-600">
                  <code className="text-green-400 text-sm font-mono break-all">
                    {generatePaymentAddress()}
                  </code>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">
                  Your Bitcoin Address (for verification)
                </Label>
                <Input
                  value={bitcoinAddress}
                  onChange={(e) => setBitcoinAddress(e.target.value)}
                  placeholder="Enter your Bitcoin address..."
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-300 font-medium text-sm">
                    Payment Instructions
                  </span>
                </div>
                <ul className="text-blue-400 text-xs space-y-1">
                  <li>• Send the exact amount to avoid delays</li>
                  <li>• Your membership activates automatically</li>
                  <li>• Benefits are available immediately</li>
                  <li>• Contact support for any issues</li>
                </ul>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPurchaseDialog(false)}
                  className="flex-1 border-gray-600"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={processPurchase}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={!bitcoinAddress.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Confirm Payment</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EmpireElitePurchase;

import React, { useState } from "react";
import {
  Shield,
  Bitcoin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  User,
  Package,
  MessageSquare,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface EscrowTransaction {
  id: string;
  productId: string;
  productName: string;
  buyerId: string;
  buyerUsername: string;
  sellerId: string;
  sellerUsername: string;
  amount: number; // in satoshis
  fee: number; // platform fee in satoshis
  empireEliteFee: number; // 0 for Empire Elite members
  status: "pending" | "funded" | "disputed" | "completed" | "cancelled";
  createdAt: Date;
  fundedAt?: Date;
  completedAt?: Date;
  disputeReason?: string;
  buyerAddress: string;
  sellerAddress: string;
  escrowAddress: string;
  messages: EscrowMessage[];
}

interface EscrowMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  isSystem?: boolean;
}

interface EscrowSystemProps {
  serverId: string;
}

const EscrowSystem: React.FC<EscrowSystemProps> = ({ serverId }) => {
  const generateBitcoinAddress = (): string => {
    // Generate a fake Bitcoin address for demo
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let result = "1";
    for (let i = 0; i < 33; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const [transactions, setTransactions] = useState<EscrowTransaction[]>(() => {
    const saved = localStorage.getItem("swiperEmpire_escrowTransactions");
    if (saved) {
      try {
        return JSON.parse(saved).map((tx: any) => ({
          ...tx,
          createdAt: new Date(tx.createdAt),
          fundedAt: tx.fundedAt ? new Date(tx.fundedAt) : undefined,
          completedAt: tx.completedAt ? new Date(tx.completedAt) : undefined,
          messages: tx.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [selectedTransaction, setSelectedTransaction] =
    useState<EscrowTransaction | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showCreateEscrow, setShowCreateEscrow] = useState(false);
  const [newEscrow, setNewEscrow] = useState({
    productName: "",
    amount: 0,
    buyerUsername: "",
    sellerUsername: "",
  });

  const { currentUser } = useAuth();
  const { toast } = useToast();

  const getUserRoles = (userId: number): string[] => {
    const userRoles = JSON.parse(
      localStorage.getItem("swiperEmpire_userRoles") || "[]",
    );
    const userRole = userRoles.find((ur: any) => ur.userId === userId);
    return userRole ? userRole.roles : [];
  };

  const isEmpireElite = (userId: number): boolean => {
    const roles = getUserRoles(userId);
    return roles.includes("empire-elite");
  };

  const isVerifiedVendor = (userId: number): boolean => {
    const roles = getUserRoles(userId);
    return roles.includes("verified-vendor");
  };

  const getFeeSettings = () => {
    const saved = localStorage.getItem("swiperEmpire_feeSettings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { empireElite: 0, verifiedVendor: 3, regularVendor: 7 };
      }
    }
    return { empireElite: 0, verifiedVendor: 3, regularVendor: 7 };
  };

  const calculateFee = (
    amount: number,
    buyerId: number,
    sellerId: number,
  ): number => {
    const feeSettings = getFeeSettings();

    // Empire Elite members pay the configured empire elite fee
    if (isEmpireElite(buyerId)) {
      return Math.floor(amount * (feeSettings.empireElite / 100));
    }

    // Use configured fees for verified vs regular vendors
    const feePercentage = isVerifiedVendor(sellerId)
      ? feeSettings.verifiedVendor / 100
      : feeSettings.regularVendor / 100;
    return Math.floor(amount * feePercentage);
  };

  const createEscrowTransaction = async () => {
    if (
      !currentUser ||
      !newEscrow.productName ||
      !newEscrow.amount ||
      !newEscrow.sellerUsername
    ) {
      toast({
        title: "Invalid escrow data",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const sellerId = Math.floor(Math.random() * 1000) + 100; // Mock seller ID
    const fee = calculateFee(newEscrow.amount, currentUser.id, sellerId);
    const empireEliteFee = isEmpireElite(currentUser.id) ? 0 : fee;

    const transaction: EscrowTransaction = {
      id: `escrow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: `product-${Date.now()}`,
      productName: newEscrow.productName,
      buyerId: String(currentUser.id),
      buyerUsername: currentUser.username,
      sellerId: String(sellerId),
      sellerUsername: newEscrow.sellerUsername,
      amount: newEscrow.amount,
      fee: fee,
      empireEliteFee: empireEliteFee,
      status: "pending",
      createdAt: new Date(),
      buyerAddress: generateBitcoinAddress(),
      sellerAddress: generateBitcoinAddress(),
      escrowAddress: generateBitcoinAddress(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          userId: "0",
          username: "Escrow System",
          content: `Escrow transaction created for ${newEscrow.productName}. Buyer must fund escrow address to proceed.`,
          timestamp: new Date(),
          isSystem: true,
        },
      ],
    };

    const updatedTransactions = [...transactions, transaction];
    setTransactions(updatedTransactions);
    localStorage.setItem(
      "swiperEmpire_escrowTransactions",
      JSON.stringify(updatedTransactions),
    );

    toast({
      title: "Escrow created",
      description: `Secure escrow transaction created for ${newEscrow.productName}`,
    });

    setNewEscrow({
      productName: "",
      amount: 0,
      buyerUsername: "",
      sellerUsername: "",
    });
    setShowCreateEscrow(false);
  };

  const updateTransactionStatus = (
    transactionId: string,
    newStatus: EscrowTransaction["status"],
  ) => {
    const updatedTransactions = transactions.map((tx) => {
      if (tx.id === transactionId) {
        const updates: Partial<EscrowTransaction> = { status: newStatus };

        if (newStatus === "funded") {
          updates.fundedAt = new Date();
        } else if (newStatus === "completed") {
          updates.completedAt = new Date();
        }

        return { ...tx, ...updates };
      }
      return tx;
    });

    setTransactions(updatedTransactions);
    localStorage.setItem(
      "swiperEmpire_escrowTransactions",
      JSON.stringify(updatedTransactions),
    );

    toast({
      title: "Transaction updated",
      description: `Transaction status changed to ${newStatus}`,
    });
  };

  const addMessage = (transactionId: string, content: string) => {
    if (!currentUser || !content.trim()) return;

    const message: EscrowMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: String(currentUser.id),
      username: currentUser.username,
      content: content.trim(),
      timestamp: new Date(),
    };

    const updatedTransactions = transactions.map((tx) => {
      if (tx.id === transactionId) {
        return { ...tx, messages: [...tx.messages, message] };
      }
      return tx;
    });

    setTransactions(updatedTransactions);
    localStorage.setItem(
      "swiperEmpire_escrowTransactions",
      JSON.stringify(updatedTransactions),
    );
    setNewMessage("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "funded":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "completed":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "disputed":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "cancelled":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const formatBitcoin = (satoshis: number) => {
    return `₿${(satoshis / 100000000).toFixed(8)}`;
  };

  const formatUSD = (satoshis: number) => {
    const usd = (satoshis / 100000000) * 40000; // Assuming 1 BTC = $40,000
    return `~$${usd.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-black/40 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Advanced Escrow System
            </CardTitle>
            <Dialog open={showCreateEscrow} onOpenChange={setShowCreateEscrow}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Bitcoin className="h-4 w-4 mr-2" />
                  Create Escrow
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-purple-500/30">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Create Escrow Transaction
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Product Name</Label>
                    <Input
                      value={newEscrow.productName}
                      onChange={(e) =>
                        setNewEscrow((prev) => ({
                          ...prev,
                          productName: e.target.value,
                        }))
                      }
                      placeholder="Enter product name"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Amount (Satoshis)</Label>
                    <Input
                      type="number"
                      value={newEscrow.amount}
                      onChange={(e) =>
                        setNewEscrow((prev) => ({
                          ...prev,
                          amount: parseInt(e.target.value) || 0,
                        }))
                      }
                      placeholder="Amount in satoshis"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    {newEscrow.amount > 0 && (
                      <div className="text-sm text-gray-400">
                        = {formatBitcoin(newEscrow.amount)} (
                        {formatUSD(newEscrow.amount)})
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Seller Username</Label>
                    <Input
                      value={newEscrow.sellerUsername}
                      onChange={(e) =>
                        setNewEscrow((prev) => ({
                          ...prev,
                          sellerUsername: e.target.value,
                        }))
                      }
                      placeholder="Enter seller username"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  {newEscrow.amount > 0 && currentUser && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="h-4 w-4 text-purple-400" />
                        <span className="text-purple-300 font-medium">
                          Fee Calculation
                        </span>
                      </div>
                      {isEmpireElite(currentUser.id) ? (
                        <div className="space-y-1">
                          <p className="text-green-300 text-sm">
                            Empire Elite: 0% fees! 🌟
                          </p>
                          <p className="text-gray-400 text-xs">
                            You save:{" "}
                            {formatBitcoin(
                              calculateFee(newEscrow.amount, 999, 999),
                            )}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-yellow-300 text-sm">
                            Platform fee:{" "}
                            {formatBitcoin(
                              calculateFee(
                                newEscrow.amount,
                                currentUser.id,
                                999,
                              ),
                            )}
                          </p>
                          <p className="text-gray-400 text-xs">
                            Upgrade to Empire Elite for 0% fees!
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateEscrow(false)}
                      className="border-gray-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createEscrowTransaction}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Create Escrow
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Transactions List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black/40 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white">Active Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-3 bg-gray-800/30 rounded border border-gray-700 cursor-pointer hover:bg-gray-700/30 transition-colors"
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        {transaction.productName}
                      </span>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-gray-300">
                        <span>Amount:</span>
                        <span>{formatBitcoin(transaction.amount)}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Fee:</span>
                        <span
                          className={
                            transaction.empireEliteFee === 0
                              ? "text-green-400"
                              : "text-yellow-400"
                          }
                        >
                          {transaction.empireEliteFee === 0
                            ? "₿0.00000000 (Elite)"
                            : formatBitcoin(transaction.fee)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Seller:</span>
                        <span>@{transaction.sellerUsername}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {transactions.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    <p>No escrow transactions yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        {selectedTransaction && (
          <Card className="bg-black/40 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Product:</span>
                    <p className="text-white">
                      {selectedTransaction.productName}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <Badge
                      className={getStatusColor(selectedTransaction.status)}
                    >
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-400">Amount:</span>
                    <p className="text-white">
                      {formatBitcoin(selectedTransaction.amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Fee:</span>
                    <p
                      className={
                        selectedTransaction.empireEliteFee === 0
                          ? "text-green-400"
                          : "text-yellow-400"
                      }
                    >
                      {selectedTransaction.empireEliteFee === 0
                        ? "₿0 (Elite)"
                        : formatBitcoin(selectedTransaction.fee)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-gray-400 text-sm">Escrow Address:</span>
                  <code className="block p-2 bg-gray-800 rounded text-green-400 text-xs font-mono">
                    {selectedTransaction.escrowAddress}
                  </code>
                </div>

                {currentUser &&
                  (selectedTransaction.buyerId === String(currentUser.id) ||
                    selectedTransaction.sellerId === String(currentUser.id)) && (
                    <div className="flex space-x-2">
                      {selectedTransaction.status === "pending" &&
                        selectedTransaction.buyerId === String(currentUser.id) && (
                          <Button
                            onClick={() => {
                              // Add a system message about funding
                              const fundMessage: EscrowMessage = {
                                id: `msg-${Date.now()}`,
                                userId: "0",
                                username: "Escrow System",
                                content: `✅ Escrow funded! ${formatBitcoin(selectedTransaction.amount + selectedTransaction.fee)} received at escrow address. Seller can now deliver the product.`,
                                timestamp: new Date(),
                                isSystem: true,
                              };

                              const updatedTransactions = transactions.map(
                                (tx) => {
                                  if (tx.id === selectedTransaction.id) {
                                    return {
                                      ...tx,
                                      messages: [...tx.messages, fundMessage],
                                      status: "funded" as const,
                                      fundedAt: new Date(),
                                    };
                                  }
                                  return tx;
                                },
                              );

                              setTransactions(updatedTransactions);
                              localStorage.setItem(
                                "swiperEmpire_escrowTransactions",
                                JSON.stringify(updatedTransactions),
                              );

                              setSelectedTransaction({
                                ...selectedTransaction,
                                status: "funded",
                                fundedAt: new Date(),
                              });

                              toast({
                                title: "Escrow Funded!",
                                description: `${formatBitcoin(selectedTransaction.amount + selectedTransaction.fee)} successfully deposited to escrow`,
                              });
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            🔒 Fund Escrow
                          </Button>
                        )}

                      {selectedTransaction.status === "funded" &&
                        selectedTransaction.sellerId === String(currentUser.id) && (
                          <Button
                            onClick={() =>
                              updateTransactionStatus(
                                selectedTransaction.id,
                                "completed",
                              )
                            }
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Release Escrow
                          </Button>
                        )}
                    </div>
                  )}

                {/* Messages */}
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Messages</h4>
                  <ScrollArea className="h-32 p-3 bg-gray-800/50 rounded">
                    <div className="space-y-2">
                      {selectedTransaction.messages.map((message) => (
                        <div key={message.id} className="text-sm">
                          <div className="flex items-center space-x-2 mb-1">
                            <span
                              className={
                                message.isSystem
                                  ? "text-purple-400"
                                  : "text-gray-300"
                              }
                            >
                              {message.username}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-white">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="bg-gray-800 border-gray-600 text-white"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        addMessage(selectedTransaction.id, newMessage)
                      }
                    />
                    <Button
                      onClick={() =>
                        addMessage(selectedTransaction.id, newMessage)
                      }
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EscrowSystem;

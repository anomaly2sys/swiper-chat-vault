import React, { useState, useEffect } from "react";
import {
  shellWalletService,
  RoutingStatus,
} from "../services/shellWalletService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Wallet, Shield, Clock, TrendingUp, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface WalletRoutingStatusProps {
  vendorId?: string;
  showVendorSummary?: boolean;
  compact?: boolean;
}

export const WalletRoutingStatus: React.FC<WalletRoutingStatusProps> = ({
  vendorId,
  showVendorSummary = false,
  compact = false,
}) => {
  const [routingStatus, setRoutingStatus] = useState<RoutingStatus | null>(
    null,
  );
  const [vendorSummary, setVendorSummary] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Get initial status
    updateStatus();

    // Listen for status changes
    const handleStatusChange = (status: RoutingStatus) => {
      setRoutingStatus(status);
    };

    shellWalletService.onStatusChange(handleStatusChange);

    // Update every 30 seconds
    const interval = setInterval(updateStatus, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [vendorId]);

  const updateStatus = () => {
    const status = shellWalletService.getRoutingStatus();
    setRoutingStatus(status);

    if (vendorId && showVendorSummary) {
      const summary = shellWalletService.getVendorFeeSummary(vendorId);
      setVendorSummary(summary);
    }
  };

  const formatBTC = (amount: number): string => {
    return amount.toFixed(8);
  };

  const getTimeUntilNextCycle = (): string => {
    if (!routingStatus?.nextCycleTime) return "Unknown";

    const now = Date.now();
    const timeLeft = routingStatus.nextCycleTime - now;

    if (timeLeft <= 0) return "Soon";

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getMixingProgress = (): number => {
    if (!routingStatus) return 0;

    const total = routingStatus.totalFeesCollected;
    if (total === 0) return 0;

    return (routingStatus.feesDispersed / total) * 100;
  };

  if (!routingStatus) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Shield className="w-4 h-4 text-green-400" />
        <span className="text-green-400">Fee securely routed</span>
        <Badge
          variant="outline"
          className="bg-green-500/20 text-green-400 border-green-500/30"
        >
          {routingStatus.activeShellWallets} active wallets
        </Badge>
      </div>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Fee Routing Status
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showDetails ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          Automated fee mixing and dispersal for enhanced privacy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vendor-specific summary */}
        {showVendorSummary && vendorSummary && (
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div>
                  Your fees: {formatBTC(vendorSummary.totalFees)} BTC (
                  {vendorSummary.transactionsCount} transactions)
                </div>
                {vendorSummary.lastFeeTime > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Last fee:{" "}
                    {new Date(vendorSummary.lastFeeTime).toLocaleDateString()}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main routing statistics */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gray-800 border-gray-600">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-lg font-bold text-blue-400">
                    {formatBTC(routingStatus.totalFeesCollected)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Collected
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-600">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-lg font-bold text-purple-400">
                    {routingStatus.activeShellWallets}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Active Wallets
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mixing progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Mixing Progress</span>
            <span className="text-sm text-muted-foreground">
              {getMixingProgress().toFixed(1)}%
            </span>
          </div>
          <Progress value={getMixingProgress()} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>In Mixing: {formatBTC(routingStatus.feesInMixing)} BTC</span>
            <span>Dispersed: {formatBTC(routingStatus.feesDispersed)} BTC</span>
          </div>
        </div>

        {/* Next cycle info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">Next Cycle</span>
          </div>
          <Badge
            variant="outline"
            className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
          >
            {getTimeUntilNextCycle()}
          </Badge>
        </div>

        {/* Detailed information */}
        {showDetails && (
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Cycle:</span>
                <span>
                  {routingStatus.lastCycleTime > 0
                    ? new Date(routingStatus.lastCycleTime).toLocaleString()
                    : "Not yet run"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Mixing Status:</span>
                <span className="text-green-400">
                  {routingStatus.feesInMixing > 0 ? "Active" : "Idle"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Security Level:</span>
                <span className="text-purple-400">High Anonymity</span>
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Fees are automatically routed through multiple shell wallets
                with random delays and mixing rounds before final dispersal to
                break transaction patterns.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletRoutingStatus;

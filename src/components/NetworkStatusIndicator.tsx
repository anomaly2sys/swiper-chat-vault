import React, { useState, useEffect } from "react";
import {
  networkDetection,
  NetworkInfo,
} from "../services/networkDetectionService";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Shield, Globe, Eye, EyeOff } from "lucide-react";

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showDetails = false,
  className = "",
}) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  useEffect(() => {
    // Get initial network info
    setNetworkInfo(networkDetection.getNetworkInfo());

    // Listen for network changes
    const handleNetworkChange = (info: NetworkInfo) => {
      setNetworkInfo(info);
    };

    networkDetection.addNetworkChangeListener(handleNetworkChange);

    return () => {
      networkDetection.removeNetworkChangeListener(handleNetworkChange);
    };
  }, []);

  if (!networkInfo) {
    return null;
  }

  const getNetworkIcon = () => {
    switch (networkInfo.type) {
      case "tor":
        return <Shield className="w-4 h-4" />;
      case "i2p":
        return <EyeOff className="w-4 h-4" />;
      default:
        return networkInfo.isSecure ? (
          <Eye className="w-4 h-4" />
        ) : (
          <Globe className="w-4 h-4" />
        );
    }
  };

  const getNetworkColor = () => {
    switch (networkInfo.type) {
      case "tor":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "i2p":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return networkInfo.isSecure
          ? "bg-green-500/20 text-green-400 border-green-500/30"
          : "bg-orange-500/20 text-orange-400 border-orange-500/30";
    }
  };

  const getNetworkLabel = () => {
    switch (networkInfo.type) {
      case "tor":
        return "Tor Network";
      case "i2p":
        return "I2P Network";
      default:
        return networkInfo.isSecure
          ? "Secure Connection"
          : "Standard Connection";
    }
  };

  const getTooltipContent = () => {
    const details = [];

    details.push(`Network: ${getNetworkLabel()}`);

    if (networkInfo.address) {
      details.push(`Address: ${networkInfo.address}`);
    }

    details.push(
      `Security: ${networkInfo.isSecure ? "Encrypted" : "Not Encrypted"}`,
    );

    if (networkInfo.proxyDetected) {
      details.push("Proxy/VPN Detected");
    }

    switch (networkInfo.type) {
      case "tor":
        details.push("Anonymous routing via Tor network");
        details.push("Maximum privacy protection");
        break;
      case "i2p":
        details.push("Invisible Internet Project network");
        details.push("Decentralized anonymous network");
        break;
      default:
        if (networkInfo.proxyDetected) {
          details.push("Privacy-enhanced connection detected");
        } else {
          details.push("Standard internet connection");
        }
    }

    return details.join("\n");
  };

  const indicator = (
    <Badge
      variant="outline"
      className={`${getNetworkColor()} ${className} flex items-center gap-1.5`}
    >
      {getNetworkIcon()}
      {showDetails && (
        <span className="text-xs font-medium">
          {networkInfo.type.toUpperCase()}
        </span>
      )}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{indicator}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-sm space-y-1">
            <div className="font-semibold">{getNetworkLabel()}</div>
            <div className="text-xs text-muted-foreground whitespace-pre-line">
              {getTooltipContent()}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NetworkStatusIndicator;

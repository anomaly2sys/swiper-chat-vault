import React, { useState, useEffect } from "react";
import { webrtcService, ConnectionState } from "../services/webrtcService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { AlertTriangle, Shield, Users, Zap, Info } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface P2PSettingsProps {
  userId: string;
  onSettingsChange?: (enabled: boolean) => void;
}

interface PeerInfo {
  id: string;
  state: ConnectionState;
  lastSeen?: number;
}

export const P2PSettings: React.FC<P2PSettingsProps> = ({
  userId,
  onSettingsChange,
}) => {
  const [isP2PEnabled, setIsP2PEnabled] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<PeerInfo[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Initialize WebRTC service
    webrtcService.setUserId(userId);
    setIsP2PEnabled(webrtcService.isP2PEnabled());

    // Listen for connection state changes
    const handleStateChange = (peerId: string, state: ConnectionState) => {
      setConnectedPeers((prev) => {
        const filtered = prev.filter((p) => p.id !== peerId);
        return [...filtered, { id: peerId, state, lastSeen: Date.now() }];
      });
    };

    webrtcService.onStateChange(handleStateChange);

    // Update connected peers initially
    updateConnectedPeers();

    const interval = setInterval(updateConnectedPeers, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const updateConnectedPeers = () => {
    const peers = webrtcService.getConnectedPeers();
    setConnectedPeers(
      peers.map((peerId) => ({
        id: peerId,
        state: webrtcService.getPeerState(peerId) as ConnectionState,
        lastSeen: Date.now(),
      })),
    );
  };

  const handleP2PToggle = async (enabled: boolean) => {
    setIsInitializing(true);

    try {
      if (enabled) {
        webrtcService.enable();
        setIsP2PEnabled(true);
      } else {
        webrtcService.disable();
        setIsP2PEnabled(false);
        setConnectedPeers([]);
      }

      onSettingsChange?.(enabled);
    } catch (error) {
      console.error("Failed to toggle P2P:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  const getStateColor = (state: ConnectionState): string => {
    switch (state) {
      case "connected":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "connecting":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "relay":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStateLabel = (state: ConnectionState): string => {
    switch (state) {
      case "connected":
        return "Direct P2P";
      case "connecting":
        return "Connecting";
      case "relay":
        return "Via Relay";
      case "failed":
        return "Failed";
      default:
        return "Disconnected";
    }
  };

  const connectedCount = connectedPeers.filter(
    (p) => p.state === "connected",
  ).length;
  const relayCount = connectedPeers.filter((p) => p.state === "relay").length;

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Peer-to-Peer Communication
        </CardTitle>
        <CardDescription>
          Enable direct encrypted communication with reduced traceability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main P2P Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="p2p-toggle" className="text-base font-medium">
              Enable P2P Mode
            </Label>
            <p className="text-sm text-muted-foreground">
              Route messages directly between users when possible
            </p>
          </div>
          <Switch
            id="p2p-toggle"
            checked={isP2PEnabled}
            onCheckedChange={handleP2PToggle}
            disabled={isInitializing}
          />
        </div>

        {isP2PEnabled && (
          <>
            <Separator />

            {/* Security Information */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                P2P mode creates direct encrypted connections between users,
                reducing server dependency and improving privacy. Messages may
                fall back to relay servers if direct connection fails.
              </AlertDescription>
            </Alert>

            {/* Connection Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-gray-800 border-gray-600">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-400" />
                    <div>
                      <div className="text-lg font-bold text-green-400">
                        {connectedCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Direct P2P
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-600">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-lg font-bold text-blue-400">
                        {relayCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Via Relay
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
                        {connectedPeers.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Peers
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Connections */}
            {connectedPeers.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Active Connections
                </Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {connectedPeers.map((peer) => (
                    <div
                      key={peer.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-800 border border-gray-600"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-sm font-mono text-gray-300">
                          {peer.id.slice(0, 8)}...
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={getStateColor(peer.state)}
                      >
                        {getStateLabel(peer.state)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy Notice */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Privacy Notice:</strong> P2P connections reveal your IP
                address to direct communication partners. Use with Tor/VPN for
                additional anonymity.
              </AlertDescription>
            </Alert>
          </>
        )}

        {!isP2PEnabled && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              Enable P2P mode to start direct encrypted communication
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default P2PSettings;

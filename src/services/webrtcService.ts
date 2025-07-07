interface WebRTCConfig {
  iceServers: RTCIceServer[];
  enableSTUN: boolean;
  enableTURN: boolean;
  fallbackToRelay: boolean;
}

interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  isConnected: boolean;
  isInitiator: boolean;
  lastSeen: number;
}

interface P2PMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  type: "text" | "file" | "system";
  encrypted?: boolean;
}

type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "failed"
  | "relay";

class WebRTCService {
  private config: WebRTCConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
    enableSTUN: true,
    enableTURN: false,
    fallbackToRelay: true,
  };

  private peers: Map<string, PeerConnection> = new Map();
  private messageHandlers: ((message: P2PMessage) => void)[] = [];
  private stateHandlers: ((peerId: string, state: ConnectionState) => void)[] =
    [];
  private localUserId: string = "";
  private isEnabled: boolean = false;

  constructor() {
    this.setupDefaultConfig();
  }

  private setupDefaultConfig(): void {
    // Use privacy-focused STUN servers when possible
    this.config.iceServers = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      // Add more privacy-focused alternatives
      { urls: "stun:openrelay.metered.ca:80" },
    ];
  }

  setUserId(userId: string): void {
    this.localUserId = userId;
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
    this.disconnectAll();
  }

  isP2PEnabled(): boolean {
    return this.isEnabled;
  }

  async createPeerConnection(
    peerId: string,
    isInitiator: boolean = false,
  ): Promise<PeerConnection> {
    if (!this.isEnabled) {
      throw new Error("P2P is disabled");
    }

    const configuration: RTCConfiguration = {
      iceServers: this.config.iceServers,
      iceCandidatePoolSize: 10,
    };

    const connection = new RTCPeerConnection(configuration);
    const peer: PeerConnection = {
      id: peerId,
      connection,
      isConnected: false,
      isInitiator,
      lastSeen: Date.now(),
    };

    // Set up connection event handlers
    this.setupConnectionHandlers(peer);

    if (isInitiator) {
      // Create data channel for the initiator
      peer.dataChannel = connection.createDataChannel("messages", {
        ordered: true,
      });
      this.setupDataChannelHandlers(peer);
    } else {
      // Wait for data channel from remote peer
      connection.ondatachannel = (event) => {
        peer.dataChannel = event.channel;
        this.setupDataChannelHandlers(peer);
      };
    }

    this.peers.set(peerId, peer);
    this.notifyStateChange(peerId, "connecting");

    return peer;
  }

  private setupConnectionHandlers(peer: PeerConnection): void {
    peer.connection.oniceconnectionstatechange = () => {
      const state = peer.connection.iceConnectionState;

      switch (state) {
        case "connected":
        case "completed":
          peer.isConnected = true;
          peer.lastSeen = Date.now();
          this.notifyStateChange(peer.id, "connected");
          break;
        case "disconnected":
          peer.isConnected = false;
          this.notifyStateChange(peer.id, "disconnected");
          break;
        case "failed":
          peer.isConnected = false;
          this.notifyStateChange(peer.id, "failed");
          if (this.config.fallbackToRelay) {
            this.fallbackToRelay(peer.id);
          }
          break;
      }
    };

    peer.connection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer through signaling server
        this.sendSignalingMessage(peer.id, {
          type: "ice-candidate",
          candidate: event.candidate,
        });
      }
    };
  }

  private setupDataChannelHandlers(peer: PeerConnection): void {
    if (!peer.dataChannel) return;

    peer.dataChannel.onopen = () => {
      console.log(`Data channel opened with ${peer.id}`);
      peer.isConnected = true;
      this.notifyStateChange(peer.id, "connected");
    };

    peer.dataChannel.onclose = () => {
      console.log(`Data channel closed with ${peer.id}`);
      peer.isConnected = false;
      this.notifyStateChange(peer.id, "disconnected");
    };

    peer.dataChannel.onmessage = (event) => {
      try {
        const message: P2PMessage = JSON.parse(event.data);
        this.handleIncomingMessage(message);
      } catch (error) {
        console.error("Failed to parse P2P message:", error);
      }
    };

    peer.dataChannel.onerror = (error) => {
      console.error(`Data channel error with ${peer.id}:`, error);
    };
  }

  async sendMessage(
    peerId: string,
    content: string,
    type: "text" | "file" = "text",
  ): Promise<boolean> {
    const peer = this.peers.get(peerId);

    if (!peer || !peer.isConnected || !peer.dataChannel) {
      // Fallback to relay if P2P fails
      if (this.config.fallbackToRelay) {
        return this.sendViaRelay(peerId, content, type);
      }
      return false;
    }

    const message: P2PMessage = {
      id: this.generateMessageId(),
      from: this.localUserId,
      to: peerId,
      content,
      timestamp: Date.now(),
      type,
    };

    try {
      peer.dataChannel.send(JSON.stringify(message));
      peer.lastSeen = Date.now();
      return true;
    } catch (error) {
      console.error("Failed to send P2P message:", error);

      if (this.config.fallbackToRelay) {
        return this.sendViaRelay(peerId, content, type);
      }
      return false;
    }
  }

  private async sendViaRelay(
    peerId: string,
    content: string,
    type: "text" | "file",
  ): Promise<boolean> {
    try {
      const response = await fetch("/api/p2p-relay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.localUserId,
          to: peerId,
          content,
          type,
          timestamp: Date.now(),
        }),
      });

      if (response.ok) {
        this.notifyStateChange(peerId, "relay");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Relay send failed:", error);
      return false;
    }
  }

  private async fallbackToRelay(peerId: string): Promise<void> {
    console.log(`Falling back to relay for peer ${peerId}`);
    this.notifyStateChange(peerId, "relay");

    // Start polling for relay messages
    this.startRelayPolling(peerId);
  }

  private startRelayPolling(peerId: string): void {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/p2p-relay/messages?from=${peerId}&to=${this.localUserId}`,
        );
        if (response.ok) {
          const messages = await response.json();
          messages.forEach((message: P2PMessage) => {
            this.handleIncomingMessage(message);
          });
        }
      } catch (error) {
        console.error("Relay polling failed:", error);
      }
    }, 2000);

    // Clean up polling when peer disconnects
    setTimeout(() => {
      if (!this.peers.get(peerId)?.isConnected) {
        clearInterval(pollInterval);
      }
    }, 60000);
  }

  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const peer = await this.createPeerConnection(peerId, true);
    const offer = await peer.connection.createOffer();
    await peer.connection.setLocalDescription(offer);

    this.sendSignalingMessage(peerId, {
      type: "offer",
      sdp: offer,
    });

    return offer;
  }

  async handleOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit> {
    const peer = await this.createPeerConnection(peerId, false);
    await peer.connection.setRemoteDescription(offer);

    const answer = await peer.connection.createAnswer();
    await peer.connection.setLocalDescription(answer);

    this.sendSignalingMessage(peerId, {
      type: "answer",
      sdp: answer,
    });

    return answer;
  }

  async handleAnswer(
    peerId: string,
    answer: RTCSessionDescriptionInit,
  ): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      await peer.connection.setRemoteDescription(answer);
    }
  }

  async handleIceCandidate(
    peerId: string,
    candidate: RTCIceCandidate,
  ): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      await peer.connection.addIceCandidate(candidate);
    }
  }

  private sendSignalingMessage(peerId: string, message: any): void {
    // Send signaling message through the main server
    fetch("/api/p2p-signaling", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.localUserId,
        to: peerId,
        message,
      }),
    }).catch(console.error);
  }

  private handleIncomingMessage(message: P2PMessage): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error("Message handler error:", error);
      }
    });
  }

  private notifyStateChange(peerId: string, state: ConnectionState): void {
    this.stateHandlers.forEach((handler) => {
      try {
        handler(peerId, state);
      } catch (error) {
        console.error("State handler error:", error);
      }
    });
  }

  disconnect(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.dataChannel?.close();
      peer.connection.close();
      this.peers.delete(peerId);
      this.notifyStateChange(peerId, "disconnected");
    }
  }

  disconnectAll(): void {
    this.peers.forEach((_, peerId) => {
      this.disconnect(peerId);
    });
  }

  getConnectedPeers(): string[] {
    return Array.from(this.peers.entries())
      .filter(([_, peer]) => peer.isConnected)
      .map(([peerId]) => peerId);
  }

  getPeerState(peerId: string): ConnectionState {
    const peer = this.peers.get(peerId);
    if (!peer) return "disconnected";
    if (!peer.isConnected) return "disconnected";
    return "connected";
  }

  onMessage(handler: (message: P2PMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  onStateChange(
    handler: (peerId: string, state: ConnectionState) => void,
  ): void {
    this.stateHandlers.push(handler);
  }

  private generateMessageId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  updateConfig(newConfig: Partial<WebRTCConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getStats(peerId: string): Promise<RTCStatsReport | null> {
    const peer = this.peers.get(peerId);
    return peer ? peer.connection.getStats() : Promise.resolve(null);
  }
}

export const webrtcService = new WebRTCService();
export type { P2PMessage, ConnectionState, WebRTCConfig };

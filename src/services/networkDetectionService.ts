interface NetworkInfo {
  type: "clearnet" | "tor" | "i2p";
  address?: string;
  isSecure: boolean;
  proxyDetected: boolean;
}

interface NetworkConfig {
  allowTor: boolean;
  allowI2P: boolean;
  preferSecure: boolean;
  autoDetect: boolean;
}

class NetworkDetectionService {
  private config: NetworkConfig = {
    allowTor: true,
    allowI2P: true,
    preferSecure: true,
    autoDetect: true,
  };

  private networkInfo: NetworkInfo = {
    type: "clearnet",
    isSecure: false,
    proxyDetected: false,
  };

  private listeners: ((info: NetworkInfo) => void)[] = [];

  constructor() {
    this.detectNetwork();
    this.setupNetworkMonitoring();
  }

  async detectNetwork(): Promise<NetworkInfo> {
    try {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;

      let networkType: "clearnet" | "tor" | "i2p" = "clearnet";
      let isSecure = protocol === "https:";
      let proxyDetected = false;

      // Detect Tor network (.onion domains)
      if (hostname.endsWith(".onion")) {
        networkType = "tor";
        isSecure = true; // Tor provides encryption
        proxyDetected = true;
      }
      // Detect I2P network (.b32.i2p domains)
      else if (hostname.endsWith(".b32.i2p") || hostname.endsWith(".i2p")) {
        networkType = "i2p";
        isSecure = true; // I2P provides encryption
        proxyDetected = true;
      }
      // Additional proxy detection methods
      else {
        proxyDetected = await this.detectProxy();
      }

      this.networkInfo = {
        type: networkType,
        address: hostname,
        isSecure,
        proxyDetected,
      };

      this.notifyListeners();
      return this.networkInfo;
    } catch (error) {
      console.error("Network detection failed:", error);
      return this.networkInfo;
    }
  }

  private async detectProxy(): Promise<boolean> {
    try {
      // Check for common proxy indicators
      const userAgent = navigator.userAgent.toLowerCase();

      // Check for Tor Browser user agent
      if (userAgent.includes("tor browser")) {
        return true;
      }

      // Check for reduced entropy indicators (common in privacy browsers)
      if (this.hasReducedEntropy()) {
        return true;
      }

      // Network timing-based detection
      const timingIndicator = await this.checkNetworkTiming();
      return timingIndicator;
    } catch {
      return false;
    }
  }

  private hasReducedEntropy(): boolean {
    // Check for fingerprinting resistance indicators
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Privacy test", 2, 2);

    const canvasData = canvas.toDataURL();

    // Tor Browser typically returns consistent canvas fingerprints
    return canvasData.length < 5000; // Simplified heuristic
  }

  private async checkNetworkTiming(): Promise<boolean> {
    try {
      const startTime = performance.now();

      // Make a small request to detect proxy latency
      await fetch("data:,", {
        method: "HEAD",
        signal: AbortSignal.timeout(1000),
      });

      const endTime = performance.now();
      const latency = endTime - startTime;

      // High latency might indicate proxy usage
      return latency > 500;
    } catch {
      return false;
    }
  }

  private setupNetworkMonitoring(): void {
    // Monitor for network changes
    window.addEventListener("online", () => this.detectNetwork());
    window.addEventListener("offline", () => this.detectNetwork());

    // Monitor hostname changes (for single-page apps)
    let currentHostname = window.location.hostname;
    setInterval(() => {
      if (window.location.hostname !== currentHostname) {
        currentHostname = window.location.hostname;
        this.detectNetwork();
      }
    }, 5000);
  }

  getNetworkInfo(): NetworkInfo {
    return { ...this.networkInfo };
  }

  isSecureConnection(): boolean {
    return this.networkInfo.isSecure || this.networkInfo.proxyDetected;
  }

  isTorNetwork(): boolean {
    return this.networkInfo.type === "tor";
  }

  isI2PNetwork(): boolean {
    return this.networkInfo.type === "i2p";
  }

  isAnonymousNetwork(): boolean {
    return this.isTorNetwork() || this.isI2PNetwork();
  }

  getRecommendedSettings(): Partial<NetworkConfig> {
    if (this.isAnonymousNetwork()) {
      return {
        preferSecure: true,
        autoDetect: true,
      };
    }
    return {};
  }

  // Asset routing based on network type
  getAssetUrl(path: string): string {
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}${path.startsWith("/") ? path : "/" + path}`;
  }

  private getBaseUrl(): string {
    if (this.isTorNetwork()) {
      // Route through Tor-optimized CDN or local assets
      return window.location.origin;
    }
    if (this.isI2PNetwork()) {
      // Route through I2P-optimized serving
      return window.location.origin;
    }
    // Regular clearnet
    return window.location.origin;
  }

  // DNS and routing adjustments
  adjustRequestOptions(options: RequestInit = {}): RequestInit {
    const headers = new Headers(options.headers);

    if (this.isAnonymousNetwork()) {
      // Add privacy-preserving headers
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      headers.set("Pragma", "no-cache");
      headers.delete("Referer");

      // Increase timeout for proxy networks
      return {
        ...options,
        headers,
        signal: options.signal || AbortSignal.timeout(30000),
      };
    }

    return { ...options, headers };
  }

  // Event listeners for network changes
  addNetworkChangeListener(callback: (info: NetworkInfo) => void): void {
    this.listeners.push(callback);
  }

  removeNetworkChangeListener(callback: (info: NetworkInfo) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.networkInfo);
      } catch (error) {
        console.error("Network listener error:", error);
      }
    });
  }

  updateConfig(newConfig: Partial<NetworkConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.autoDetect) {
      this.detectNetwork();
    }
  }

  getConfig(): NetworkConfig {
    return { ...this.config };
  }
}

export const networkDetection = new NetworkDetectionService();
export type { NetworkInfo, NetworkConfig };

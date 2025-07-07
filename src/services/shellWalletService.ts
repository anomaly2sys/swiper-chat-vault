interface ShellWallet {
  id: string;
  address: string;
  balance: number;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
  cycleNumber: number;
}

interface FeeTransaction {
  id: string;
  sourceTransactionId: string;
  amount: number;
  shellWalletId: string;
  destinationAddress?: string;
  timestamp: number;
  status: "pending" | "mixing" | "dispersed" | "completed" | "failed";
  mixingRounds: number;
  delayMinutes: number;
}

interface MixingConfig {
  minMixingRounds: number;
  maxMixingRounds: number;
  minDelayMinutes: number;
  maxDelayMinutes: number;
  maxWalletBalance: number;
  cycleIntervalHours: number;
  enableAutomatedMixing: boolean;
}

interface RoutingStatus {
  totalFeesCollected: number;
  feesInMixing: number;
  feesDispersed: number;
  activeShellWallets: number;
  lastCycleTime: number;
  nextCycleTime: number;
}

class ShellWalletService {
  private config: MixingConfig = {
    minMixingRounds: 3,
    maxMixingRounds: 7,
    minDelayMinutes: 30,
    maxDelayMinutes: 180,
    maxWalletBalance: 0.1, // BTC
    cycleIntervalHours: 6,
    enableAutomatedMixing: true,
  };

  private shellWallets: Map<string, ShellWallet> = new Map();
  private feeTransactions: Map<string, FeeTransaction> = new Map();
  private routingStatus: RoutingStatus = {
    totalFeesCollected: 0,
    feesInMixing: 0,
    feesDispersed: 0,
    activeShellWallets: 0,
    lastCycleTime: 0,
    nextCycleTime: 0,
  };

  private mixingTimer: NodeJS.Timeout | null = null;
  private statusListeners: ((status: RoutingStatus) => void)[] = [];

  constructor() {
    this.loadPersistedData();
    this.startAutomatedMixing();
  }

  private loadPersistedData(): void {
    try {
      const savedWallets = localStorage.getItem("shellWallets");
      const savedTransactions = localStorage.getItem("feeTransactions");
      const savedStatus = localStorage.getItem("routingStatus");

      if (savedWallets) {
        const wallets = JSON.parse(savedWallets);
        this.shellWallets = new Map(wallets);
      }

      if (savedTransactions) {
        const transactions = JSON.parse(savedTransactions);
        this.feeTransactions = new Map(transactions);
      }

      if (savedStatus) {
        this.routingStatus = JSON.parse(savedStatus);
      }
    } catch (error) {
      console.error("Failed to load persisted shell wallet data:", error);
    }
  }

  private persistData(): void {
    try {
      localStorage.setItem(
        "shellWallets",
        JSON.stringify(Array.from(this.shellWallets.entries())),
      );
      localStorage.setItem(
        "feeTransactions",
        JSON.stringify(Array.from(this.feeTransactions.entries())),
      );
      localStorage.setItem("routingStatus", JSON.stringify(this.routingStatus));
    } catch (error) {
      console.error("Failed to persist shell wallet data:", error);
    }
  }

  async routeFee(sourceTransactionId: string, amount: number): Promise<string> {
    try {
      // Create or get available shell wallet
      const shellWallet = await this.getAvailableShellWallet();

      // Create fee transaction record
      const feeTransaction: FeeTransaction = {
        id: this.generateTransactionId(),
        sourceTransactionId,
        amount,
        shellWalletId: shellWallet.id,
        timestamp: Date.now(),
        status: "pending",
        mixingRounds: this.randomBetween(
          this.config.minMixingRounds,
          this.config.maxMixingRounds,
        ),
        delayMinutes: this.randomBetween(
          this.config.minDelayMinutes,
          this.config.maxDelayMinutes,
        ),
      };

      this.feeTransactions.set(feeTransaction.id, feeTransaction);

      // Update shell wallet balance
      shellWallet.balance += amount;
      shellWallet.lastUsed = Date.now();

      // Update routing status
      this.routingStatus.totalFeesCollected += amount;
      this.routingStatus.feesInMixing += amount;

      // Initiate automated mixing process
      this.scheduleMixing(feeTransaction.id);

      this.persistData();
      this.notifyStatusChange();

      return feeTransaction.id;
    } catch (error) {
      console.error("Fee routing failed:", error);
      throw new Error("Fee routing failed");
    }
  }

  private async getAvailableShellWallet(): Promise<ShellWallet> {
    // Find an active wallet with capacity
    for (const wallet of this.shellWallets.values()) {
      if (wallet.isActive && wallet.balance < this.config.maxWalletBalance) {
        return wallet;
      }
    }

    // Create new shell wallet if none available
    return this.createShellWallet();
  }

  private createShellWallet(): ShellWallet {
    const wallet: ShellWallet = {
      id: this.generateWalletId(),
      address: this.generateWalletAddress(),
      balance: 0,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      isActive: true,
      cycleNumber: Math.floor(
        Date.now() / (1000 * 60 * 60 * this.config.cycleIntervalHours),
      ),
    };

    this.shellWallets.set(wallet.id, wallet);
    this.routingStatus.activeShellWallets++;

    return wallet;
  }

  private generateWalletAddress(): string {
    // Generate a realistic-looking Bitcoin address for shell wallet
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let address = "1"; // Legacy Bitcoin address format

    for (let i = 0; i < 33; i++) {
      address += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return address;
  }

  private scheduleMixing(transactionId: string): void {
    const transaction = this.feeTransactions.get(transactionId);
    if (!transaction) return;

    // Schedule mixing with random delay
    setTimeout(
      () => {
        this.executeMixing(transactionId);
      },
      transaction.delayMinutes * 60 * 1000,
    );
  }

  private async executeMixing(transactionId: string): Promise<void> {
    const transaction = this.feeTransactions.get(transactionId);
    if (!transaction || transaction.status !== "pending") return;

    try {
      transaction.status = "mixing";

      // Simulate mixing rounds
      for (let round = 0; round < transaction.mixingRounds; round++) {
        await this.performMixingRound(transaction);

        // Random delay between rounds
        const roundDelay = this.randomBetween(5, 30) * 1000; // 5-30 seconds
        await new Promise((resolve) => setTimeout(resolve, roundDelay));
      }

      // Complete the mixing process
      await this.completeMixing(transaction);
    } catch (error) {
      console.error("Mixing execution failed:", error);
      transaction.status = "failed";
    }

    this.persistData();
    this.notifyStatusChange();
  }

  private async performMixingRound(transaction: FeeTransaction): Promise<void> {
    // Simulate transferring through multiple shell wallets
    const intermediateWallet = this.createShellWallet();

    // Move funds to intermediate wallet
    const sourceWallet = this.shellWallets.get(transaction.shellWalletId);
    if (sourceWallet) {
      sourceWallet.balance -= transaction.amount;
      intermediateWallet.balance += transaction.amount;

      // Update transaction to track new wallet
      transaction.shellWalletId = intermediateWallet.id;
    }
  }

  private async completeMixing(transaction: FeeTransaction): Promise<void> {
    // Generate final destination address
    transaction.destinationAddress = this.generateDestinationAddress();
    transaction.status = "dispersed";

    // Remove from shell wallet
    const shellWallet = this.shellWallets.get(transaction.shellWalletId);
    if (shellWallet) {
      shellWallet.balance -= transaction.amount;

      // Deactivate wallet if empty
      if (shellWallet.balance <= 0) {
        shellWallet.isActive = false;
        this.routingStatus.activeShellWallets--;
      }
    }

    // Update routing status
    this.routingStatus.feesInMixing -= transaction.amount;
    this.routingStatus.feesDispersed += transaction.amount;

    // Mark as completed after a final delay
    setTimeout(
      () => {
        transaction.status = "completed";
        this.persistData();
        this.notifyStatusChange();
      },
      this.randomBetween(30, 120) * 1000,
    ); // 30-120 seconds final delay
  }

  private generateDestinationAddress(): string {
    // Generate different address format for final destination
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let address = "bc1"; // Bech32 format for final dispersal

    for (let i = 0; i < 39; i++) {
      address += chars
        .charAt(Math.floor(Math.random() * chars.length))
        .toLowerCase();
    }

    return address;
  }

  private startAutomatedMixing(): void {
    if (!this.config.enableAutomatedMixing) return;

    const cycleInterval = this.config.cycleIntervalHours * 60 * 60 * 1000;

    this.mixingTimer = setInterval(() => {
      this.executeCycle();
    }, cycleInterval);

    // Calculate next cycle time
    this.routingStatus.nextCycleTime = Date.now() + cycleInterval;
  }

  private async executeCycle(): Promise<void> {
    console.log("Executing shell wallet cycle");

    this.routingStatus.lastCycleTime = Date.now();
    this.routingStatus.nextCycleTime =
      Date.now() + this.config.cycleIntervalHours * 60 * 60 * 1000;

    // Retire old wallets
    const currentCycle = Math.floor(
      Date.now() / (1000 * 60 * 60 * this.config.cycleIntervalHours),
    );

    for (const wallet of this.shellWallets.values()) {
      if (wallet.cycleNumber < currentCycle - 2) {
        // Retire wallets older than 2 cycles
        wallet.isActive = false;
        if (wallet.balance > 0) {
          // Force dispersal of remaining balance
          await this.forceDispersalWallet(wallet);
        }
      }
    }

    // Clean up old inactive wallets
    this.cleanupInactiveWallets();

    this.persistData();
    this.notifyStatusChange();
  }

  private async forceDispersalWallet(wallet: ShellWallet): Promise<void> {
    if (wallet.balance <= 0) return;

    const feeTransaction: FeeTransaction = {
      id: this.generateTransactionId(),
      sourceTransactionId: "cycle-cleanup",
      amount: wallet.balance,
      shellWalletId: wallet.id,
      destinationAddress: this.generateDestinationAddress(),
      timestamp: Date.now(),
      status: "completed",
      mixingRounds: 1,
      delayMinutes: 0,
    };

    this.feeTransactions.set(feeTransaction.id, feeTransaction);

    // Update status
    this.routingStatus.feesInMixing -= wallet.balance;
    this.routingStatus.feesDispersed += wallet.balance;

    wallet.balance = 0;
    wallet.isActive = false;
    this.routingStatus.activeShellWallets--;
  }

  private cleanupInactiveWallets(): void {
    const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const [walletId, wallet] of this.shellWallets.entries()) {
      if (
        !wallet.isActive &&
        wallet.lastUsed < cutoffTime &&
        wallet.balance === 0
      ) {
        this.shellWallets.delete(walletId);
      }
    }
  }

  getRoutingStatus(): RoutingStatus {
    return { ...this.routingStatus };
  }

  getFeeTransactionStatus(transactionId: string): FeeTransaction | null {
    const transaction = this.feeTransactions.get(transactionId);
    return transaction ? { ...transaction } : null;
  }

  getVendorFeeSummary(vendorId: string): {
    totalFees: number;
    transactionsCount: number;
    lastFeeTime: number;
  } {
    let totalFees = 0;
    let transactionsCount = 0;
    let lastFeeTime = 0;

    for (const transaction of this.feeTransactions.values()) {
      if (transaction.sourceTransactionId.includes(vendorId)) {
        totalFees += transaction.amount;
        transactionsCount++;
        lastFeeTime = Math.max(lastFeeTime, transaction.timestamp);
      }
    }

    return { totalFees, transactionsCount, lastFeeTime };
  }

  onStatusChange(listener: (status: RoutingStatus) => void): void {
    this.statusListeners.push(listener);
  }

  private notifyStatusChange(): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(this.routingStatus);
      } catch (error) {
        console.error("Status listener error:", error);
      }
    });
  }

  updateConfig(newConfig: Partial<MixingConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.enableAutomatedMixing !== undefined) {
      if (newConfig.enableAutomatedMixing && !this.mixingTimer) {
        this.startAutomatedMixing();
      } else if (!newConfig.enableAutomatedMixing && this.mixingTimer) {
        clearInterval(this.mixingTimer);
        this.mixingTimer = null;
      }
    }

    this.persistData();
  }

  getConfig(): MixingConfig {
    return { ...this.config };
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private generateTransactionId(): string {
    return (
      "tx_" + Date.now().toString(36) + Math.random().toString(36).substr(2)
    );
  }

  private generateWalletId(): string {
    return (
      "shell_" + Date.now().toString(36) + Math.random().toString(36).substr(2)
    );
  }

  stop(): void {
    if (this.mixingTimer) {
      clearInterval(this.mixingTimer);
      this.mixingTimer = null;
    }
    this.persistData();
  }
}

export const shellWalletService = new ShellWalletService();
export type { ShellWallet, FeeTransaction, MixingConfig, RoutingStatus };

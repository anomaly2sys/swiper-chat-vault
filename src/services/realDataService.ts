// Real Data Service - Provides accurate application statistics
class RealDataService {
  
  // Get real user statistics
  getUsers() {
    try {
      const users = JSON.parse(localStorage.getItem("swiperEmpire_users") || "[]");
      return users;
    } catch {
      return [];
    }
  }

  // Get real message count from all servers and channels
  getMessageCount() {
    try {
      const servers = JSON.parse(localStorage.getItem("swiperEmpire_servers") || "[]");
      const directMessages = JSON.parse(localStorage.getItem("swiperEmpire_directMessages") || "[]");
      const messages = JSON.parse(localStorage.getItem("swiperEmpire_messages") || "[]");
      
      let totalMessages = directMessages.length + messages.length;
      
      // Count messages from escrow system
      const escrowTransactions = JSON.parse(localStorage.getItem("swiperEmpire_escrowTransactions") || "[]");
      escrowTransactions.forEach((tx: any) => {
        if (tx.messages) {
          totalMessages += tx.messages.length;
        }
      });

      return totalMessages;
    } catch {
      return 0;
    }
  }

  // Get real server count
  getServerCount() {
    try {
      const servers = JSON.parse(localStorage.getItem("swiperEmpire_servers") || "[]");
      return servers.length;
    } catch {
      return 0;
    }
  }

  // Get active users (simulate based on recent activity)
  getActiveUsers() {
    try {
      const users = this.getUsers();
      // Simulate active users as users with recent activity
      const activeCount = users.filter((user: any) => {
        return user.status === "online" || user.lastSeen > Date.now() - 300000; // 5 minutes
      }).length;
      
      return Math.max(1, activeCount); // At least 1 for current user
    } catch {
      return 1;
    }
  }

  // Get system uptime (simulate based on session start)
  getSystemUptime() {
    try {
      const sessionStart = localStorage.getItem("swiperEmpire_sessionStart");
      if (!sessionStart) {
        localStorage.setItem("swiperEmpire_sessionStart", Date.now().toString());
        return "Just started";
      }
      
      const uptimeMs = Date.now() - parseInt(sessionStart);
      const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
      const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } catch {
      return "Unknown";
    }
  }

  // Get database size estimate
  getDatabaseSize() {
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (key.startsWith("swiperEmpire_")) {
          totalSize += localStorage[key].length;
        }
      }
      
      // Convert to KB
      const sizeKB = Math.round(totalSize / 1024);
      if (sizeKB > 1024) {
        return `${Math.round(sizeKB / 1024)}MB (Local Storage)`;
      }
      return `${sizeKB}KB (Local Storage)`;
    } catch {
      return "Unknown";
    }
  }

  // Get real channel count across all servers
  getChannelCount() {
    try {
      const servers = JSON.parse(localStorage.getItem("swiperEmpire_servers") || "[]");
      let totalChannels = 0;
      
      servers.forEach((server: any) => {
        if (server.categories) {
          server.categories.forEach((category: any) => {
            if (category.channels) {
              totalChannels += category.channels.length;
            }
          });
        }
      });
      
      return totalChannels;
    } catch {
      return 0;
    }
  }

  // Get escrow transaction count
  getEscrowTransactionCount() {
    try {
      const transactions = JSON.parse(localStorage.getItem("swiperEmpire_escrowTransactions") || "[]");
      return transactions.length;
    } catch {
      return 0;
    }
  }

  // Get comprehensive stats
  getStats() {
    return {
      totalUsers: this.getUsers().length,
      totalMessages: this.getMessageCount(),
      totalServers: this.getServerCount(),
      totalChannels: this.getChannelCount(),
      activeUsers: this.getActiveUsers(),
      escrowTransactions: this.getEscrowTransactionCount(),
      systemUptime: this.getSystemUptime(),
      databaseSize: this.getDatabaseSize(),
    };
  }
}

export const realDataService = new RealDataService();
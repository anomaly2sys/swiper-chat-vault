// Enhanced Message Service for better persistence and synchronization
export class MessageService {
  private static STORAGE_PREFIX = "swiperEmpire_";
  private static MESSAGE_KEY = "messages";
  private static DM_KEY = "directMessages";

  // Save message with better persistence
  static saveMessage(message: any, channelId?: string, isDirectMessage = false) {
    try {
      const key = isDirectMessage ? this.DM_KEY : this.MESSAGE_KEY;
      const storageKey = `${this.STORAGE_PREFIX}${key}`;
      const messages = JSON.parse(localStorage.getItem(storageKey) || "[]");
      
      // Add metadata for better tracking
      const enhancedMessage = {
        ...message,
        saved: true,
        savedAt: new Date().toISOString(),
        channelId: channelId || message.channelId,
        synchronized: true
      };
      
      messages.push(enhancedMessage);
      
      // Keep only last 1000 messages per type to prevent storage overflow
      if (messages.length > 1000) {
        messages.splice(0, messages.length - 1000);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(messages));
      
      // Also trigger a custom event for real-time updates
      window.dispatchEvent(new CustomEvent('messageAdded', { 
        detail: { message: enhancedMessage, isDirectMessage } 
      }));
      
      return enhancedMessage;
    } catch (error) {
      console.error("Failed to save message:", error);
      return message;
    }
  }

  // Get messages for a specific channel with better filtering
  static getChannelMessages(channelId: string, limit = 100) {
    try {
      const messages = JSON.parse(localStorage.getItem(`${this.STORAGE_PREFIX}${this.MESSAGE_KEY}`) || "[]");
      return messages
        .filter((msg: any) => msg.channelId === channelId)
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-limit); // Get last N messages
    } catch {
      return [];
    }
  }

  // Get direct messages between two users
  static getDirectMessages(userId1: string, userId2: string, limit = 100) {
    try {
      const messages = JSON.parse(localStorage.getItem(`${this.STORAGE_PREFIX}${this.DM_KEY}`) || "[]");
      return messages
        .filter((msg: any) => 
          (msg.authorId === userId1 && msg.recipientId === userId2) ||
          (msg.authorId === userId2 && msg.recipientId === userId1)
        )
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-limit);
    } catch {
      return [];
    }
  }

  // Delete message
  static deleteMessage(messageId: string, isDirectMessage = false) {
    try {
      const key = isDirectMessage ? this.DM_KEY : this.MESSAGE_KEY;
      const storageKey = `${this.STORAGE_PREFIX}${key}`;
      const messages = JSON.parse(localStorage.getItem(storageKey) || "[]");
      
      const updatedMessages = messages.filter((msg: any) => msg.id !== messageId);
      localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
      
      window.dispatchEvent(new CustomEvent('messageDeleted', { 
        detail: { messageId, isDirectMessage } 
      }));
      
      return true;
    } catch {
      return false;
    }
  }

  // Get total message count across all channels and DMs
  static getTotalMessageCount() {
    try {
      const messages = JSON.parse(localStorage.getItem(`${this.STORAGE_PREFIX}${this.MESSAGE_KEY}`) || "[]");
      const directMessages = JSON.parse(localStorage.getItem(`${this.STORAGE_PREFIX}${this.DM_KEY}`) || "[]");
      return messages.length + directMessages.length;
    } catch {
      return 0;
    }
  }

  // Clear old messages (cleanup utility)
  static clearOldMessages(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      [this.MESSAGE_KEY, this.DM_KEY].forEach(key => {
        const storageKey = `${this.STORAGE_PREFIX}${key}`;
        const messages = JSON.parse(localStorage.getItem(storageKey) || "[]");
        
        const filteredMessages = messages.filter((msg: any) => 
          new Date(msg.timestamp) > cutoffDate
        );
        
        localStorage.setItem(storageKey, JSON.stringify(filteredMessages));
      });
      
      return true;
    } catch {
      return false;
    }
  }
}

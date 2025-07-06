export type ChannelType = "text" | "voice" | "announcements" | "shop";

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  serverId: string;
  categoryId?: string;
  position: number;
  isPrivate: boolean;
  description?: string;
  createdAt: Date;
  // Shop channel specific
  products?: Product[];
  // Voice channel specific
  connectedUsers?: string[];
  maxUsers?: number;
  // Announcements specific
  allowedRoles?: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in Bitcoin satoshis
  imageUrl?: string;
  ownerId: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Ticket {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  serverId: string;
  status: "open" | "closed" | "completed";
  messages: TicketMessage[];
  createdAt: Date;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export const CHANNEL_PERMISSIONS = {
  text: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES"],
  voice: ["VIEW_CHANNEL", "CONNECT", "SPEAK", "MUTE_MEMBERS"],
  announcements: ["VIEW_CHANNEL", "SEND_MESSAGES"], // Only certain roles
  shop: ["VIEW_CHANNEL", "CREATE_PRODUCTS", "BUY_PRODUCTS"],
} as const;

export const QUANTUM_ENCRYPTION_CONFIG = {
  algorithm: "AES-256-GCM",
  keySize: 256,
  ivSize: 16,
  tagSize: 16,
  quantumResistant: true,
  description: "Military-grade quantum encryption for all communications",
} as const;

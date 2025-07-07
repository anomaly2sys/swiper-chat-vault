import React, { useState } from "react";
import {
  HelpCircle,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Send,
  Paperclip,
  Star,
  Shield,
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

interface SupportTicket {
  id: string;
  userId: number;
  username: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting_response" | "resolved" | "closed";
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  messages: SupportMessage[];
}

interface SupportMessage {
  id: string;
  ticketId: string;
  userId: number;
  username: string;
  content: string;
  timestamp: Date;
  isStaff?: boolean;
  attachments?: string[];
}

const SUPPORT_CATEGORIES = [
  { value: "account", label: "Account Issues" },
  { value: "payment", label: "Bitcoin Payment Issues" },
  { value: "shop", label: "Shop/Product Issues" },
  { value: "escrow", label: "Escrow Problems" },
  { value: "empire_elite", label: "Empire Elite Membership" },
  { value: "technical", label: "Technical Problems" },
  { value: "report", label: "Report User/Content" },
  { value: "feature", label: "Feature Request" },
  { value: "other", label: "Other" },
];

const SupportSystem: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem("swiperEmpire_supportTickets");
    if (saved) {
      try {
        return JSON.parse(saved).map((ticket: any) => ({
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          updatedAt: new Date(ticket.updatedAt),
          resolvedAt: ticket.resolvedAt
            ? new Date(ticket.resolvedAt)
            : undefined,
          messages: ticket.messages.map((msg: any) => ({
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

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null,
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [newTicket, setNewTicket] = useState({
    title: "",
    category: "",
    priority: "medium" as const,
    description: "",
  });

  const { currentUser } = useAuth();
  const { toast } = useToast();

  const createSupportTicket = () => {
    if (
      !currentUser ||
      !newTicket.title.trim() ||
      !newTicket.category ||
      !newTicket.description.trim()
    ) {
      toast({
        title: "Invalid ticket data",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const initialMessage: SupportMessage = {
      id: `msg-${Date.now()}`,
      ticketId,
      userId: currentUser.id,
      username: currentUser.username,
      content: newTicket.description,
      timestamp: new Date(),
    };

    const ticket: SupportTicket = {
      id: ticketId,
      userId: currentUser.id,
      username: currentUser.username,
      title: newTicket.title.trim(),
      category: newTicket.category,
      priority: newTicket.priority,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [initialMessage],
    };

    const updatedTickets = [...tickets, ticket];
    setTickets(updatedTickets);
    localStorage.setItem(
      "swiperEmpire_supportTickets",
      JSON.stringify(updatedTickets),
    );

    toast({
      title: "Support ticket created",
      description: `Ticket #${ticket.id.slice(-8)} has been created. Our team will respond soon.`,
    });

    setNewTicket({
      title: "",
      category: "",
      priority: "medium",
      description: "",
    });
    setShowCreateDialog(false);
  };

  const addMessage = (ticketId: string, content: string) => {
    if (!currentUser || !content.trim()) return;

    const message: SupportMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ticketId,
      userId: currentUser.id,
      username: currentUser.username,
      content: content.trim(),
      timestamp: new Date(),
      isStaff: currentUser.isAdmin,
    };

    const updatedTickets = tickets.map((ticket) => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          messages: [...ticket.messages, message],
          updatedAt: new Date(),
          status: currentUser.isAdmin
            ? ("waiting_response" as const)
            : ("in_progress" as const),
        };
      }
      return ticket;
    });

    setTickets(updatedTickets);
    localStorage.setItem(
      "swiperEmpire_supportTickets",
      JSON.stringify(updatedTickets),
    );
    setNewMessage("");

    if (currentUser.isAdmin) {
      toast({
        title: "Response sent",
        description: "Your response has been sent to the user",
      });
    }
  };

  const updateTicketStatus = (
    ticketId: string,
    newStatus: SupportTicket["status"],
  ) => {
    const updatedTickets = tickets.map((ticket) => {
      if (ticket.id === ticketId) {
        const updates: Partial<SupportTicket> = {
          status: newStatus,
          updatedAt: new Date(),
        };

        if (newStatus === "resolved" || newStatus === "closed") {
          updates.resolvedAt = new Date();
        }

        return { ...ticket, ...updates };
      }
      return ticket;
    });

    setTickets(updatedTickets);
    localStorage.setItem(
      "swiperEmpire_supportTickets",
      JSON.stringify(updatedTickets),
    );

    toast({
      title: "Ticket updated",
      description: `Ticket status changed to ${newStatus.replace("_", " ")}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "in_progress":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "waiting_response":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "resolved":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "closed":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "payment":
        return <Star className="h-4 w-4" />;
      case "empire_elite":
        return <Star className="h-4 w-4" />;
      case "technical":
        return <AlertTriangle className="h-4 w-4" />;
      case "account":
        return <User className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const userTickets = currentUser?.isAdmin
    ? tickets
    : tickets.filter((t) => t.userId === currentUser?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-black/40 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <HelpCircle className="h-5 w-5 mr-2" />
              Support System
              {currentUser?.isAdmin && (
                <Badge className="ml-2 bg-purple-500/20 text-purple-300">
                  Admin View
                </Badge>
              )}
            </CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Create Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-purple-500/30 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Create Support Ticket
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Title *</Label>
                    <Input
                      value={newTicket.title}
                      onChange={(e) =>
                        setNewTicket((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Brief description of your issue"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Category *</Label>
                      <Select
                        value={newTicket.category}
                        onValueChange={(value) =>
                          setNewTicket((prev) => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORT_CATEGORIES.map((category) => (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Priority</Label>
                      <Select
                        value={newTicket.priority}
                        onValueChange={(value: any) =>
                          setNewTicket((prev) => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Description *</Label>
                    <Textarea
                      value={newTicket.description}
                      onChange={(e) =>
                        setNewTicket((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Provide detailed information about your issue..."
                      className="bg-gray-800 border-gray-600 text-white min-h-[120px]"
                    />
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-400" />
                      <span className="text-blue-300 font-medium">
                        Support Guidelines
                      </span>
                    </div>
                    <ul className="text-blue-400 text-sm mt-2 space-y-1">
                      <li>• Be specific and provide details</li>
                      <li>
                        • Include error messages or screenshots if applicable
                      </li>
                      <li>• Our team responds within 24 hours</li>
                      <li>• Empire Elite members get priority support</li>
                    </ul>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                      className="border-gray-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createSupportTicket}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Create Ticket
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Tickets Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets List */}
        <Card className="bg-black/40 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white">
              {currentUser?.isAdmin ? "All Support Tickets" : "My Tickets"}
              <Badge className="ml-2 bg-blue-500/20 text-blue-300">
                {userTickets.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {userTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3 bg-gray-800/30 rounded border border-gray-700 cursor-pointer hover:bg-gray-700/30 transition-colors"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {getCategoryIcon(ticket.category)}
                          <span className="text-white font-medium">
                            {ticket.title}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.replace("_", " ")}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>#{ticket.id.slice(-8)}</span>
                      <div className="flex items-center space-x-2">
                        {currentUser?.isAdmin && (
                          <span>@{ticket.username}</span>
                        )}
                        <span>{ticket.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {userTickets.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    <p>No support tickets yet</p>
                    <p className="text-sm">Create a ticket if you need help</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Ticket Details */}
        {selectedTicket && (
          <Card className="bg-black/40 border-purple-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  Ticket #{selectedTicket.id.slice(-8)}
                </CardTitle>
                {currentUser?.isAdmin && (
                  <div className="flex space-x-2">
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(value: any) =>
                        updateTicketStatus(selectedTicket.id, value)
                      }
                    >
                      <SelectTrigger className="w-40 bg-gray-800 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="waiting_response">
                          Waiting Response
                        </SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">User:</span>
                    <p className="text-white">@{selectedTicket.username}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Category:</span>
                    <p className="text-white">
                      {
                        SUPPORT_CATEGORIES.find(
                          (c) => c.value === selectedTicket.category,
                        )?.label
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Priority:</span>
                    <Badge
                      className={getPriorityColor(selectedTicket.priority)}
                    >
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {selectedTicket.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Conversation</h4>
                  <ScrollArea className="h-48 p-3 bg-gray-800/50 rounded">
                    <div className="space-y-3">
                      {selectedTicket.messages.map((message) => (
                        <div key={message.id} className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-medium ${message.isStaff ? "text-purple-400" : "text-blue-400"}`}
                            >
                              {message.username}
                              {message.isStaff && (
                                <Shield className="h-3 w-3 inline ml-1" />
                              )}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {message.timestamp.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-white text-sm bg-gray-700/50 p-2 rounded">
                            {message.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {selectedTicket.status !== "closed" && (
                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="bg-gray-800 border-gray-600 text-white"
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          addMessage(selectedTicket.id, newMessage)
                        }
                      />
                      <Button
                        onClick={() =>
                          addMessage(selectedTicket.id, newMessage)
                        }
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SupportSystem;

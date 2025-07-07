import { useState, useEffect, useCallback } from "react";
import { Message, DirectMessage } from "@/contexts/ChatContext";

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = localStorage.getItem("swiperEmpire_messages");
    if (savedMessages) {
      try {
        return JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          disappearAt: msg.disappearAt ? new Date(msg.disappearAt) : undefined,
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(() => {
    const savedDMs = localStorage.getItem("swiperEmpire_directMessages");
    if (savedDMs) {
      try {
        return JSON.parse(savedDMs).map((dm: any) => ({
          ...dm,
          timestamp: new Date(dm.timestamp),
          disappearAt: dm.disappearAt ? new Date(dm.disappearAt) : undefined,
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem("swiperEmpire_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(
      "swiperEmpire_directMessages",
      JSON.stringify(directMessages)
    );
  }, [directMessages]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);

    // Auto-delete after 35 seconds if disappearing
    if (message.isDisappearing && message.disappearAt) {
      const timeout = message.disappearAt.getTime() - Date.now();
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== message.id));
      }, timeout);
    }
  }, []);

  const addDirectMessage = useCallback((dm: DirectMessage) => {
    setDirectMessages(prev => [...prev, dm]);

    // Auto-delete after 35 seconds if disappearing
    if (dm.isDisappearing && dm.disappearAt) {
      const timeout = dm.disappearAt.getTime() - Date.now();
      setTimeout(() => {
        setDirectMessages(prev => prev.filter(msg => msg.id !== dm.id));
      }, timeout);
    }
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    setDirectMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  const updateMessageStatus = useCallback((messageId: string, status: Message["status"]) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      )
    );
  }, []);

  return {
    messages,
    directMessages,
    addMessage,
    addDirectMessage,
    deleteMessage,
    updateMessageStatus,
  };
};
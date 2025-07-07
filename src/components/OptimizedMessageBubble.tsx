import React, { memo, useCallback } from "react";
import { Message } from "@/contexts/ChatContext";
import MessageBubble from "./MessageBubble";

// Extend Message to match MessageBubble props
interface ExtendedMessage extends Message {
  text?: string;
  sender?: string;
}

interface OptimizedMessageBubbleProps {
  message: ExtendedMessage;
  isOwn: boolean;
  onDelete: (messageId: string) => void;
}

export const OptimizedMessageBubble = memo<OptimizedMessageBubbleProps>(({ 
  message, 
  isOwn, 
  onDelete 
}) => {
  const handleDelete = useCallback(() => {
    onDelete(message.id);
  }, [message.id, onDelete]);

  // Convert message format for MessageBubble component
  const messageForBubble = {
    ...message,
    text: message.content || message.text || "",
    sender: message.authorId || message.sender || ""
  };

  return (
    <MessageBubble
      message={messageForBubble}
      isOwn={isOwn}
      onDelete={handleDelete}
    />
  );
});

OptimizedMessageBubble.displayName = "OptimizedMessageBubble";

export default OptimizedMessageBubble;
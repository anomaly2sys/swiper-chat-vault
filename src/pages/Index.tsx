import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/AuthForm";
import MainChatApp from "@/components/MainChatApp";

const Index = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <MainChatApp />;
  }

  return <AuthForm onSuccess={() => {}} />;
};

export default Index;

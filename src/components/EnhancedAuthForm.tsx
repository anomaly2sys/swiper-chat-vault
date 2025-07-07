import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  LogIn,
  UserPlus,
  Check,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { verificationService } from "@/services/verificationService";

interface EnhancedAuthFormProps {
  onSuccess: () => void;
}

type AuthStep = "login" | "register" | "verify-email" | "verify-sms";

const EnhancedAuthForm: React.FC<EnhancedAuthFormProps> = ({ onSuccess }) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    displayName: "",
    email: "",
    phone: "",
    verificationCode: "",
  });
  const [verificationData, setVerificationData] = useState({
    codeId: "",
    type: "" as "email" | "sms",
    recipient: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter a password",
        variant: "destructive",
      });
      return false;
    }

    if (currentStep === "register") {
      if (!formData.displayName.trim()) {
        toast({
          title: "Display name required",
          description: "Please enter a display name",
          variant: "destructive",
        });
        return false;
      }

      if (formData.password.length < 8) {
        toast({
          title: "Password too short",
          description: "Password must be at least 8 characters long",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await login(formData.username, formData.password);

      if (result.success) {
        toast({
          title: "Welcome back!",
          description: "Successfully logged in",
        });
        onSuccess();
      } else {
        toast({
          title: "Authentication failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    // Check if verification is needed
    if ((formData.email || formData.phone) && !needsVerification) {
      setNeedsVerification(true);
      if (formData.email) {
        await sendEmailVerification();
      } else if (formData.phone) {
        await sendSMSVerification();
      }
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        username: formData.username,
        password: formData.password,
        displayName: formData.displayName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      });

      if (result.success) {
        toast({
          title: "Account created!",
          description: "Welcome to SwiperEmpire!",
        });
        onSuccess();
      } else {
        toast({
          title: "Registration failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailVerification = async () => {
    setIsLoading(true);
    try {
      const result = await verificationService.sendEmailVerification(
        formData.email,
        formData.displayName,
      );

      if (result.success && result.codeId) {
        setVerificationData({
          codeId: result.codeId,
          type: "email",
          recipient: formData.email,
        });
        setCurrentStep("verify-email");
        toast({
          title: "Verification code sent",
          description: "Check your email for the verification code",
        });
      } else {
        toast({
          title: "Verification failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendSMSVerification = async () => {
    setIsLoading(true);
    try {
      const result = await verificationService.sendSMSVerification(
        formData.phone,
        formData.displayName,
      );

      if (result.success && result.codeId) {
        setVerificationData({
          codeId: result.codeId,
          type: "sms",
          recipient: formData.phone,
        });
        setCurrentStep("verify-sms");
        toast({
          title: "Verification code sent",
          description: "Check your phone for the verification code",
        });
      } else {
        toast({
          title: "Verification failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!formData.verificationCode.trim()) {
      toast({
        title: "Verification code required",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await verificationService.verifyCode(
        verificationData.codeId,
        formData.verificationCode,
      );

      if (result.success) {
        toast({
          title: "Verification successful",
          description: "Proceeding with registration",
        });
        setNeedsVerification(false);
        await handleRegister();
      } else {
        toast({
          title: "Verification failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Verification failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "login":
        return "Welcome Back";
      case "register":
        return "Join the Empire";
      case "verify-email":
        return "Verify Email";
      case "verify-sms":
        return "Verify Phone";
      default:
        return "Authentication";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case "login":
        return "Sign in to your secure account";
      case "register":
        return "Create your account and join SwiperEmpire";
      case "verify-email":
        return `Enter the verification code sent to ${verificationData.recipient}`;
      case "verify-sms":
        return `Enter the verification code sent to ${verificationData.recipient}`;
      default:
        return "";
    }
  };

  const goBack = () => {
    if (currentStep === "verify-email" || currentStep === "verify-sms") {
      setCurrentStep("register");
      setNeedsVerification(false);
      setFormData((prev) => ({ ...prev, verificationCode: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/40 border-purple-500/30 backdrop-blur-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">SwiperEmpire</h1>
          </div>

          {(currentStep === "verify-email" || currentStep === "verify-sms") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="absolute top-4 left-4 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <CardTitle className="text-white">{getStepTitle()}</CardTitle>
          <CardDescription className="text-gray-300">
            {getStepDescription()}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* Login/Register Forms */}
            {(currentStep === "login" || currentStep === "register") && (
              <>
                {/* Username */}
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-white flex items-center"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Enter your username"
                    required
                  />
                </div>

                {/* Display Name (Register only) */}
                {currentStep === "register" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="displayName"
                      className="text-white flex items-center"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Display Name
                    </Label>
                    <Input
                      id="displayName"
                      type="text"
                      value={formData.displayName}
                      onChange={(e) =>
                        handleInputChange("displayName", e.target.value)
                      }
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                      placeholder="How others will see you"
                      required
                    />
                  </div>
                )}

                {/* Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-white flex items-center"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 pr-10"
                      placeholder="Enter your password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {currentStep === "register" && (
                    <p className="text-xs text-gray-400">
                      Must be at least 8 characters long
                    </p>
                  )}
                </div>

                {/* Optional Fields (Register only) */}
                {currentStep === "register" && (
                  <>
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-white flex items-center"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Email{" "}
                        <span className="text-gray-400 text-sm ml-1">
                          (optional - for verification)
                        </span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-white flex items-center"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Phone{" "}
                        <span className="text-gray-400 text-sm ml-1">
                          (optional - for verification)
                        </span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" required />
                      <Label htmlFor="terms" className="text-sm text-gray-300">
                        I agree to the Terms of Service and Privacy Policy
                      </Label>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <Button
                  onClick={
                    currentStep === "login" ? handleLogin : handleRegister
                  }
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>
                        {currentStep === "login"
                          ? "Signing in..."
                          : "Creating account..."}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {currentStep === "login" ? (
                        <LogIn className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      <span>
                        {currentStep === "login"
                          ? "Sign In"
                          : needsVerification
                            ? "Send Verification Code"
                            : "Create Account"}
                      </span>
                    </div>
                  )}
                </Button>

                {/* Toggle Mode */}
                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-purple-300 hover:text-purple-200"
                    onClick={() =>
                      setCurrentStep(
                        currentStep === "login" ? "register" : "login",
                      )
                    }
                  >
                    {currentStep === "login"
                      ? "Don't have an account? Sign up"
                      : "Already have an account? Sign in"}
                  </Button>
                </div>
              </>
            )}

            {/* Verification Forms */}
            {(currentStep === "verify-email" ||
              currentStep === "verify-sms") && (
              <>
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
                    {currentStep === "verify-email" ? (
                      <Mail className="h-8 w-8 text-purple-400" />
                    ) : (
                      <Phone className="h-8 w-8 text-purple-400" />
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-blue-500/20 text-blue-300"
                  >
                    Verification Required
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verificationCode" className="text-white">
                    Verification Code
                  </Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    value={formData.verificationCode}
                    onChange={(e) =>
                      handleInputChange(
                        "verificationCode",
                        e.target.value.toUpperCase(),
                      )
                    }
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 text-center text-lg font-mono tracking-widest"
                    placeholder="XXXXXX"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-400">
                    Enter the 6-character code sent to your{" "}
                    {verificationData.type}
                  </p>
                </div>

                <Button
                  onClick={handleVerification}
                  disabled={isLoading || formData.verificationCode.length !== 6}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Check className="h-4 w-4" />
                      <span>Verify Code</span>
                    </div>
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-sm text-gray-400 hover:text-white"
                    onClick={
                      verificationData.type === "email"
                        ? sendEmailVerification
                        : sendSMSVerification
                    }
                    disabled={isLoading}
                  >
                    Resend verification code
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAuthForm;

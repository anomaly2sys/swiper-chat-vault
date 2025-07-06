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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AuthFormProps {
  onSuccess: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    displayName: "",
    email: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let success = false;

      if (isLogin) {
        success = await login(formData.username, formData.password);
      } else {
        if (!formData.displayName.trim()) {
          toast({
            title: "Display name required",
            description: "Please enter a display name",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        success = await register({
          username: formData.username,
          password: formData.password,
          displayName: formData.displayName,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
        });
      }

      if (success) {
        toast({
          title: isLogin ? "Welcome back!" : "Account created!",
          description: isLogin
            ? "Successfully logged in"
            : "Welcome to SwiperEmpire!",
        });
        onSuccess();
      } else {
        toast({
          title: "Authentication failed",
          description: isLogin
            ? "Invalid username or password"
            : "Username already exists",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/40 border-purple-500/30 backdrop-blur-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">SwiperEmpire</h1>
          </div>
          <CardTitle className="text-white">
            {isLogin ? "Welcome Back" : "Join the Empire"}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {isLogin
              ? "Sign in to your secure account"
              : "Create your account and join SwiperEmpire"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                placeholder="Enter your username"
                required
              />
            </div>

            {/* Display Name (Register only) */}
            {!isLogin && (
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
                  required={!isLogin}
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
            </div>

            {/* Optional Fields (Register only) */}
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-white flex items-center"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email{" "}
                    <span className="text-gray-400 text-sm ml-1">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
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
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
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
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {isLogin ? (
                    <LogIn className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  <span>{isLogin ? "Sign In" : "Create Account"}</span>
                </div>
              )}
            </Button>

            {/* Toggle Mode */}
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                className="text-purple-300 hover:text-purple-200"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </Button>
            </div>
          </form>

          {/* Admin Hint */}
          {isLogin && (
            <div className="mt-6 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <p className="text-xs text-purple-300 text-center">
                <Shield className="h-3 w-3 inline mr-1" />
                Admin login: BlankBank / TheRomanDoctor213*
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;

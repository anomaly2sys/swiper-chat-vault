import React, { useState } from "react";
import {
  Flag,
  AlertTriangle,
  MessageSquare,
  User,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Report {
  id: string;
  reporterId: string;
  reporterUsername: string;
  reportedUserId: string;
  reportedUsername: string;
  reason: string;
  category: string;
  description: string;
  status: "open" | "investigating" | "closed";
  createdAt: Date;
  adminNotes?: string;
}

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUsername: string;
  reportedUserId: string;
}

interface AdminReportViewProps {
  reports: Report[];
  onUpdateReport: (reportId: string, updates: Partial<Report>) => void;
  onChatWithReporter: (reportId: string) => void;
}

const REPORT_CATEGORIES = [
  { value: "spam", label: "Spam or unwanted content" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech or discrimination" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "scam", label: "Scam or fraud" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Other" },
];

export const ReportDialog: React.FC<ReportDialogProps> = ({
  isOpen,
  onClose,
  reportedUsername,
  reportedUserId,
}) => {
  const [reportData, setReportData] = useState({
    category: "",
    reason: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleSubmitReport = async () => {
    if (!reportData.category || !reportData.reason.trim()) {
      toast({
        title: "Incomplete report",
        description: "Please select a category and provide a reason",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const report = {
        id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        reporterId: currentUser?.id,
        reporterUsername: currentUser?.username,
        reportedUserId,
        reportedUsername,
        category: reportData.category,
        reason: reportData.reason,
        description: reportData.description,
        status: "open" as const,
        createdAt: new Date(),
      };

      // In a real app, this would be sent to the server
      console.log("Report submitted:", report);

      toast({
        title: "Report submitted",
        description:
          "Your report has been sent to the administrators for review",
      });

      setReportData({ category: "", reason: "", description: "" });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 border-red-500/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Flag className="h-5 w-5 mr-2 text-red-400" />
            Report User
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">
              Reporting:{" "}
              <span className="font-medium">@{reportedUsername}</span>
            </p>
            <p className="text-red-400 text-xs mt-1">
              Reports are reviewed by administrators and false reports may
              result in penalties.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Category</Label>
            <Select
              value={reportData.category}
              onValueChange={(value) =>
                setReportData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="Select report category" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Reason *</Label>
            <Input
              value={reportData.reason}
              onChange={(e) =>
                setReportData((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder="Brief reason for this report"
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">
              Additional Details (Optional)
            </Label>
            <Textarea
              value={reportData.description}
              onChange={(e) =>
                setReportData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Provide additional context or details about this report"
              className="bg-gray-800 border-gray-600 text-white"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReport}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Flag className="h-4 w-4 mr-2" />
              )}
              Submit Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const AdminReportView: React.FC<AdminReportViewProps> = ({
  reports,
  onUpdateReport,
  onChatWithReporter,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "investigating":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "closed":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "harassment":
        return <AlertTriangle className="h-4 w-4" />;
      case "spam":
        return <MessageSquare className="h-4 w-4" />;
      case "impersonation":
        return <User className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          User Reports
        </h3>
        <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
          {reports.filter((r) => r.status === "open").length} Open
        </Badge>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-4 bg-gray-800/30 rounded-lg border border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(report.category)}
                  <span className="text-white font-medium">
                    @{report.reportedUsername}
                  </span>
                  <Badge className={getStatusColor(report.status)}>
                    {report.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  {report.createdAt.toLocaleDateString()}
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-gray-400 text-sm">Category:</span>
                  <span className="text-white ml-2">
                    {
                      REPORT_CATEGORIES.find((c) => c.value === report.category)
                        ?.label
                    }
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Reason:</span>
                  <span className="text-white ml-2">{report.reason}</span>
                </div>
                {report.description && (
                  <div>
                    <span className="text-gray-400 text-sm">Details:</span>
                    <p className="text-white ml-2 text-sm">
                      {report.description}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-400 text-sm">Reported by:</span>
                  <span className="text-white ml-2">
                    @{report.reporterUsername}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button
                  size="sm"
                  onClick={() => onChatWithReporter(report.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Chat with Reporter
                </Button>

                {report.status === "open" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onUpdateReport(report.id, { status: "investigating" })
                    }
                    className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
                  >
                    Start Investigation
                  </Button>
                )}

                {report.status !== "closed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onUpdateReport(report.id, { status: "closed" })
                    }
                    className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Close Report
                  </Button>
                )}
              </div>
            </div>
          ))}

          {reports.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p>No reports submitted yet</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

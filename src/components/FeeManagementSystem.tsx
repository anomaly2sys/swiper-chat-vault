import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Save, RotateCcw } from "lucide-react";

interface FeeSettings {
  empireElite: number;
  verifiedVendor: number;
  regularVendor: number;
}

const FeeManagementSystem: React.FC = () => {
  const [fees, setFees] = useState<FeeSettings>(() => {
    const saved = localStorage.getItem("swiperEmpire_feeSettings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { empireElite: 0, verifiedVendor: 3, regularVendor: 7 };
      }
    }
    return { empireElite: 0, verifiedVendor: 3, regularVendor: 7 };
  });

  const [tempFees, setTempFees] = useState<FeeSettings>(fees);
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem("swiperEmpire_feeSettings", JSON.stringify(fees));
  }, [fees]);

  const saveFees = () => {
    setFees(tempFees);
    toast({
      title: "Fee Settings Updated",
      description: "New fee structure has been applied to all transactions",
    });
  };

  const resetFees = () => {
    const defaultFees = { empireElite: 0, verifiedVendor: 3, regularVendor: 7 };
    setTempFees(defaultFees);
    setFees(defaultFees);
    toast({
      title: "Fees Reset",
      description: "Fee structure reset to default values",
    });
  };

  const hasChanges = JSON.stringify(fees) !== JSON.stringify(tempFees);

  return (
    <Card className="bg-black/40 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Fee Management System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Fee Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-300">
              {fees.empireElite}%
            </p>
            <p className="text-gray-400 text-sm">Empire Elite Fees</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-300">
              {fees.verifiedVendor}%
            </p>
            <p className="text-gray-400 text-sm">Verified Vendor Fees</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-300">
              {fees.regularVendor}%
            </p>
            <p className="text-gray-400 text-sm">Regular Vendor Fees</p>
          </div>
        </div>

        {/* Fee Configuration */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">
            Configure Fee Rates
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-purple-300">Empire Elite Fee (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={tempFees.empireElite}
                onChange={(e) =>
                  setTempFees((prev) => ({
                    ...prev,
                    empireElite: parseFloat(e.target.value) || 0,
                  }))
                }
                className="bg-gray-800 border-purple-500/30 text-white"
              />
              <p className="text-xs text-gray-400">
                Premium members - typically 0% for maximum benefit
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-yellow-300">Verified Vendor Fee (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={tempFees.verifiedVendor}
                onChange={(e) =>
                  setTempFees((prev) => ({
                    ...prev,
                    verifiedVendor: parseFloat(e.target.value) || 0,
                  }))
                }
                className="bg-gray-800 border-yellow-500/30 text-white"
              />
              <p className="text-xs text-gray-400">
                Trusted vendors with verification badge
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-red-300">Regular Vendor Fee (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={tempFees.regularVendor}
                onChange={(e) =>
                  setTempFees((prev) => ({
                    ...prev,
                    regularVendor: parseFloat(e.target.value) || 0,
                  }))
                }
                className="bg-gray-800 border-red-500/30 text-white"
              />
              <p className="text-xs text-gray-400">
                Standard vendors without verification
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button
              onClick={saveFees}
              disabled={!hasChanges}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {hasChanges ? "Save Changes" : "No Changes"}
            </Button>

            <Button
              onClick={resetFees}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>

          {hasChanges && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <p className="text-yellow-300 text-sm">
                ⚠️ You have unsaved changes. Click "Save Changes" to apply new
                fee rates.
              </p>
            </div>
          )}
        </div>

        {/* Fee Impact Calculator */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-white">
            Fee Impact Calculator
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded">
              <div className="text-purple-300 font-medium">
                Empire Elite on ₿1.00
              </div>
              <div className="text-white">
                Fee: ₿{(tempFees.empireElite / 100).toFixed(4)}
              </div>
              <div className="text-gray-400">
                Seller gets: ₿{(1 - tempFees.empireElite / 100).toFixed(4)}
              </div>
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <div className="text-yellow-300 font-medium">
                Verified Vendor on ₿1.00
              </div>
              <div className="text-white">
                Fee: ₿{(tempFees.verifiedVendor / 100).toFixed(4)}
              </div>
              <div className="text-gray-400">
                Seller gets: ₿{(1 - tempFees.verifiedVendor / 100).toFixed(4)}
              </div>
            </div>

            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
              <div className="text-red-300 font-medium">
                Regular Vendor on ₿1.00
              </div>
              <div className="text-white">
                Fee: ₿{(tempFees.regularVendor / 100).toFixed(4)}
              </div>
              <div className="text-gray-400">
                Seller gets: ₿{(1 - tempFees.regularVendor / 100).toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeeManagementSystem;

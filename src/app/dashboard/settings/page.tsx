"use client";

import { useState } from "react";
import { useSettings } from "@/lib/settings-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { settings, updateSetting, loading } = useSettings();
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState(settings.currency);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSetting("currency", currency);
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCcw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <Settings className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">System Settings</h2>
          <p className="text-zinc-500">Manage your application preferences and global configurations.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">General Preferences</CardTitle>
            <CardDescription className="text-zinc-400">Configure core system behavior and localization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-zinc-300">System Currency</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={currency} onValueChange={(val) => setCurrency(val || "")}>
                  <SelectTrigger className="bg-black/40 border-zinc-800 text-white">
                    <SelectValue placeholder="Select currency..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectItem value="LKR">Sri Lankan Rupee (LKR)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-sm text-zinc-400">
                    Currently set to <span className="text-white font-bold">{currency}</span>. This affects all price displays across the dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800/50 flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold px-8"
              >
                {saving ? "Saving..." : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

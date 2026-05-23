"use client";

import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Globe,
  Clock,
  Save,
  Mail,
  User,
  School,
  CheckCircle2,
  Sparkles,
  Volume2,
} from "lucide-react";

export default function AdminSettings() {
  const { user } = useAppStore();
  const [saved, setSaved] = useState(false);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newApplicationAlert, setNewApplicationAlert] = useState(true);
  const [analysisCompleteAlert, setAnalysisCompleteAlert] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Assessment settings
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [requireVideoReview, setRequireVideoReview] = useState(false);
  const [minVideoDuration, setMinVideoDuration] = useState("15");
  const [maxVideoDuration, setMaxVideoDuration] = useState("120");

  // Display settings
  const [scoreDisplay, setScoreDisplay] = useState("percentage");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [language, setLanguage] = useState("en");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
          ⚙️ Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your platform preferences and configuration
        </p>
        <div className="divider-rainbow mt-3 max-w-xs" />
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* Profile Section */}
        <Card className="card-3d bg-playful-card-purple">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <div className="icon-bubble icon-bubble-purple h-8 w-8">
                <User className="h-4 w-4" />
              </div>
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-purple-700">Full Name</Label>
                <Input
                  value={user?.name || ""}
                  className="input-playful mt-1.5"
                  readOnly
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-purple-700">Email</Label>
                <Input
                  value={user?.email || ""}
                  className="input-playful mt-1.5"
                  readOnly
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-purple-700">Role</Label>
                <div className="mt-1.5">
                  <Badge className="badge-3d bg-purple-100 text-purple-700 border-purple-200 text-sm px-3 py-1">
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    School Administrator
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold text-purple-700">School</Label>
                <Input
                  value="KinderAssess Academy"
                  className="input-playful mt-1.5"
                  readOnly
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="card-3d bg-playful-card-coral">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <div className="icon-bubble icon-bubble-coral h-8 w-8">
                <Bell className="h-4 w-4" />
              </div>
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/60 border border-[#FF6B6B]/10">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#FF6B6B]" />
                <div>
                  <p className="text-sm font-semibold">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive alerts via email</p>
                </div>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                className="data-[state=checked]:bg-[#FF6B6B]"
              />
            </div>

            {/* New Application Alert */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/60 border border-[#FF6B6B]/10">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-[#FF6B6B]" />
                <div>
                  <p className="text-sm font-semibold">New Application Alert</p>
                  <p className="text-xs text-muted-foreground">Get notified when a parent submits an application</p>
                </div>
              </div>
              <Switch
                checked={newApplicationAlert}
                onCheckedChange={setNewApplicationAlert}
                className="data-[state=checked]:bg-[#FF6B6B]"
              />
            </div>

            {/* Analysis Complete */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/60 border border-[#FF6B6B]/10">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-[#FF6B6B]" />
                <div>
                  <p className="text-sm font-semibold">AI Analysis Complete</p>
                  <p className="text-xs text-muted-foreground">Get notified when AI finishes analyzing a student</p>
                </div>
              </div>
              <Switch
                checked={analysisCompleteAlert}
                onCheckedChange={setAnalysisCompleteAlert}
                className="data-[state=checked]:bg-[#FF6B6B]"
              />
            </div>

            {/* Weekly Digest */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/60 border border-[#FF6B6B]/10">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[#FF6B6B]" />
                <div>
                  <p className="text-sm font-semibold">Weekly Digest</p>
                  <p className="text-xs text-muted-foreground">Receive a weekly summary of all applications</p>
                </div>
              </div>
              <Switch
                checked={weeklyDigest}
                onCheckedChange={setWeeklyDigest}
                className="data-[state=checked]:bg-[#FF6B6B]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Assessment Settings */}
        <Card className="card-3d bg-playful-card-green">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <div className="icon-bubble icon-bubble-green h-8 w-8">
                <School className="h-4 w-4" />
              </div>
              Assessment Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auto Analyze */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/60 border border-green-200/50">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold">Auto AI Analysis</p>
                  <p className="text-xs text-muted-foreground">Automatically start AI analysis when all videos are uploaded</p>
                </div>
              </div>
              <Switch
                checked={autoAnalyze}
                onCheckedChange={setAutoAnalyze}
                className="data-[state=checked]:bg-green-600"
              />
            </div>

            {/* Require Video Review */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/60 border border-green-200/50">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold">Require Video Review</p>
                  <p className="text-xs text-muted-foreground">Admin must review videos before AI analysis</p>
                </div>
              </div>
              <Switch
                checked={requireVideoReview}
                onCheckedChange={setRequireVideoReview}
                className="data-[state=checked]:bg-green-600"
              />
            </div>

            {/* Video Duration Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-green-700">
                  Min Video Duration (sec)
                </Label>
                <Input
                  type="number"
                  value={minVideoDuration}
                  onChange={(e) => setMinVideoDuration(e.target.value)}
                  className="input-playful mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-green-700">
                  Max Video Duration (sec)
                </Label>
                <Input
                  type="number"
                  value={maxVideoDuration}
                  onChange={(e) => setMaxVideoDuration(e.target.value)}
                  className="input-playful mt-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="card-3d bg-playful-card-yellow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <div className="icon-bubble icon-bubble-yellow h-8 w-8">
                <Palette className="h-4 w-4" />
              </div>
              Display & Localization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score Display */}
            <div>
              <Label className="text-sm font-semibold text-amber-700">Score Display Format</Label>
              <Select value={scoreDisplay} onValueChange={setScoreDisplay}>
                <SelectTrigger className="input-playful mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (0-100%)</SelectItem>
                  <SelectItem value="grade">Grade (A/B/C/D)</SelectItem>
                  <SelectItem value="level">Level (Ready/Observation/Support)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Format */}
            <div>
              <Label className="text-sm font-semibold text-amber-700">Date Format</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger className="input-playful mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div>
              <Label className="text-sm font-semibold text-amber-700">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="input-playful mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="ar">🇸🇦 Arabic</SelectItem>
                  <SelectItem value="hi">🇮🇳 Hindi</SelectItem>
                  <SelectItem value="fr">🇫🇷 French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-4 pt-2 pb-6">
          <Button
            onClick={handleSave}
            className="btn-3d bg-[#FF6B6B] hover:bg-[#ff5252] text-white gap-2 px-8"
          >
            {saved ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
          {saved && (
            <span className="text-sm font-semibold text-green-600 animate-bounce-in">
              ✅ Settings saved successfully!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Users,
  Radio,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { triggerHaptic } from "@/lib/telegram";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBackendUrl: string;
  onBackendUpdated: (newUrl: string) => void;
}

interface UserListItem {
  id: string;
  email: string;
  username: string;
  role: "admin" | "user";
  createdAt: number;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  currentBackendUrl,
  onBackendUpdated,
}) => {
  const [backendUrl, setBackendUrl] = useState(currentBackendUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    online: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userList, setUserList] = useState<UserListItem[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [copiedPreset, setCopiedPreset] = useState<string | null>(null);

  useEffect(() => {
    setBackendUrl(currentBackendUrl);
    setTestResult(null);
    setSaveSuccess(false);

    if (isOpen) {
      // Fetch latest admin config and user stats
      fetch("/api/admin/config")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.config?.activeBackendUrl) {
            setBackendUrl(data.config.activeBackendUrl);
          }
          if (data?.users) {
            setUserList(data.users);
            setTotalUsers(data.totalUsers || data.users.length);
          }
        })
        .catch(() => null);
    }
  }, [isOpen, currentBackendUrl]);

  if (!isOpen) return null;

  const handleTestConnection = async (targetUrl?: string) => {
    const urlToTest = targetUrl || backendUrl;
    if (!urlToTest) {
      setTestResult({
        online: false,
        message: "Please enter a backend URL to test",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    triggerHaptic("medium");

    try {
      const res = await fetch("/api/admin/test-backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToTest }),
      });

      const data = await res.json();
      setTestResult({
        online: !!data.online,
        message: data.message || (data.online ? "Backend Online" : "Connection Failed"),
        latencyMs: data.latencyMs,
      });

      if (data.online) {
        triggerHaptic("success");
      } else {
        triggerHaptic("error");
      }
    } catch (err: unknown) {
      triggerHaptic("error");
      setTestResult({
        online: false,
        message: err instanceof Error ? err.message : "Connection failed",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    triggerHaptic("medium");

    const clean = backendUrl.trim();
    if (clean.includes("your-service") || clean.includes("your-user-space")) {
      triggerHaptic("error");
      alert('Please replace "your-service" with the actual name of your deployed Render service (e.g. https://soundrip-backend.onrender.com).');
      setIsSaving(false);
      return;
    }

    if (clean.includes("vercel.app")) {
      triggerHaptic("error");
      alert('You entered your Vercel frontend URL. The backend switcher requires your Render or Docker Python microservice URL (e.g. https://soundrip-backend.onrender.com).');
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeBackendUrl: clean }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      triggerHaptic("success");
      setSaveSuccess(true);
      onBackendUpdated(clean);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      triggerHaptic("error");
      alert(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const applyPreset = (presetUrl: string, name: string) => {
    setBackendUrl(presetUrl);
    setCopiedPreset(name);
    setTimeout(() => setCopiedPreset(null), 1500);
    triggerHaptic("light");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel-glow p-6 sm:p-8 shadow-2xl border border-purple-500/30 custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-md shadow-purple-500/20">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Admin Control Center
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Master Access
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Switch backends, test connections & monitor user conversions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Active Backend Engine Switcher */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-4 h-4 text-cyan-400" />
              Global Converter Backend Engine
            </label>
            <span className="text-[11px] text-gray-400">
              Updates active backend globally for all users
            </span>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] text-gray-400 block mb-2 font-medium">
              Quick Switcher Presets:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() =>
                  applyPreset("https://your-service.koyeb.app", "Koyeb")
                }
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 text-left transition-all hover:bg-white/10 group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>Koyeb</span>
                  {copiedPreset === "Koyeb" ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Zap className="w-3 h-3 text-cyan-400" />
                  )}
                </div>
                <span className="text-[10px] text-gray-400 truncate block mt-0.5">
                  Free Docker
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset("https://your-service.onrender.com", "Render")
                }
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/40 text-left transition-all hover:bg-white/10 group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>Render</span>
                  {copiedPreset === "Render" ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Zap className="w-3 h-3 text-purple-400" />
                  )}
                </div>
                <span className="text-[10px] text-gray-400 truncate block mt-0.5">
                  Web Service
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    "https://your-user-space.hf.space",
                    "HuggingFace"
                  )
                }
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/40 text-left transition-all hover:bg-white/10 group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>Hugging Face</span>
                  {copiedPreset === "HuggingFace" ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Zap className="w-3 h-3 text-amber-400" />
                  )}
                </div>
                <span className="text-[10px] text-gray-400 truncate block mt-0.5">
                  16GB Space
                </span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("http://localhost:8080", "Local")}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 text-left transition-all hover:bg-white/10 group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>Localhost</span>
                  {copiedPreset === "Local" ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Zap className="w-3 h-3 text-emerald-400" />
                  )}
                </div>
                <span className="text-[10px] text-gray-400 truncate block mt-0.5">
                  Port 8080
                </span>
              </button>
            </div>
          </div>

          {/* URL Input Bar & Action Buttons */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="https://your-service.koyeb.app"
                className="flex-1 px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-cyan-400"
              />

              <button
                type="button"
                onClick={() => handleTestConnection()}
                disabled={isTesting || !backendUrl}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-gray-200 hover:text-white disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                title="Ping backend to test availability"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <Radio className="w-4 h-4 text-cyan-400" />
                )}
                <span>Test Ping</span>
              </button>

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Apply Globally</span>
                )}
              </button>
            </div>

            {/* In-line helper alerts */}
            {backendUrl.includes("your-service") && (
              <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span>⚠️</span>
                <span>
                  Replace <code className="bg-amber-500/20 px-1 rounded text-amber-200">your-service</code> with the actual name of your Render web service (e.g. <code className="text-white">soundrip-backend</code>).
                </span>
              </p>
            )}

            {backendUrl.includes("vercel.app") && (
              <p className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span>❌</span>
                <span>
                  This is your Vercel frontend URL! Enter your Python/Docker backend URL (from Render, Railway, or localhost).
                </span>
              </p>
            )}

            {/* Test Connection Result Alert */}
            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                  testResult.online
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      testResult.online ? "bg-emerald-400" : "bg-rose-400"
                    } animate-pulse`}
                  />
                  <span className="font-medium">{testResult.message}</span>
                </div>
                {testResult.latencyMs !== undefined && (
                  <span className="font-mono text-[11px] opacity-80">
                    {testResult.latencyMs}ms
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Registered Users Overview */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              User Accounts ({totalUsers})
            </h4>
            <span className="text-[11px] text-gray-400">
              Users can register and save personal conversion history
            </span>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden divide-y divide-white/5 max-h-48 overflow-y-auto">
            {userList.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                No external users registered yet.
              </div>
            ) : (
              userList.map((u) => (
                <div
                  key={u.id}
                  className="p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300 text-xs uppercase">
                      {u.username[0] || "U"}
                    </div>
                    <div>
                      <span className="font-semibold text-white block">
                        {u.username}
                      </span>
                      <span className="text-[11px] text-gray-400">{u.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === "admin"
                          ? "bg-purple-500/30 text-purple-300 border border-purple-500/40"
                          : "bg-white/10 text-gray-300"
                      }`}
                    >
                      {u.role}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 3: Koyeb / Render Deployment Guide */}
        <div className="mt-6 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2 text-xs">
          <div className="flex items-center justify-between text-cyan-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              How to Deploy on Koyeb in 60 Seconds:
            </span>
            <a
              href="https://app.koyeb.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1 text-[11px]"
            >
              Open Koyeb <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-gray-300 text-[11px] leading-relaxed">
            <li>
              Log in to Koyeb, click <strong>Create App</strong> or <strong>Create Service</strong>.
            </li>
            <li>
              Choose <strong>GitHub</strong> (click Connect/Install GitHub if first time).
            </li>
            <li>
              Select repository: <strong>Ala2ar/yt-music-converter</strong>.
            </li>
            <li>
              Under <strong>Root Directory</strong>, type: <code className="bg-black/50 px-1 py-0.5 rounded text-cyan-300 font-mono">backend</code>.
            </li>
            <li>
              Choose <strong>Free</strong> tier and click <strong>Deploy</strong>. Copy your live URL here!
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

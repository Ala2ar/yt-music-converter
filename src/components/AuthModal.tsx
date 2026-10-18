"use client";

import React, { useState } from "react";
import { X, Lock, Mail, User, Shield, ArrowRight, Loader2, KeyRound, Sparkles } from "lucide-react";
import { triggerHaptic } from "@/lib/telegram";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: "admin" | "user";
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [showAdminKeyInput, setShowAdminKeyInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    triggerHaptic("medium");

    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        tab === "login"
          ? { emailOrUsername, password }
          : { email, username, password, adminKey: adminKey.trim() || undefined };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      triggerHaptic("success");
      onAuthSuccess(data.user);
      onClose();
    } catch (err: unknown) {
      triggerHaptic("error");
      const msg = err instanceof Error ? err.message : "Authentication error";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl glass-panel-glow p-6 sm:p-8 shadow-2xl border border-white/15">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {tab === "login" ? "Welcome Back" : "Create Account"}
              </h3>
              <p className="text-[11px] text-gray-400">
                {tab === "login"
                  ? "Sign in to manage backends & preferences"
                  : "Join SoundRip for custom settings & cloud history"}
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

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 mt-4 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              tab === "login"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              tab === "register"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-5 text-xs">
          {tab === "login" ? (
            <div>
              <label className="block text-gray-300 font-medium mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="Enter username or email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-gray-300 font-medium mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-300 font-medium mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Admin Setup Key toggle for Register */}
          {tab === "register" && (
            <div className="pt-1">
              {!showAdminKeyInput ? (
                <button
                  type="button"
                  onClick={() => setShowAdminKeyInput(true)}
                  className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Register as Site Owner / Admin?</span>
                </button>
              ) : (
                <div className="space-y-1.5 p-3 rounded-xl bg-purple-950/30 border border-purple-500/20">
                  <label className="block text-purple-300 font-semibold text-[11px] flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    Admin Passkey
                  </label>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter passkey if authorized"
                    className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-purple-500/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-purple-400 font-mono"
                  />
                  <p className="text-[10px] text-gray-400">
                    Provides access to the global backend switcher & admin controls.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-75 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all mt-4"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{tab === "login" ? "Sign In" : "Create Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

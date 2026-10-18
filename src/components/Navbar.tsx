"use client";

import { Disc3, SlidersHorizontal, Sparkles, Shield, User, LogOut } from "lucide-react";
import { AuthUser } from "./AuthModal";

interface NavbarProps {
  onOpenSettings: () => void;
  historyCount: number;
  onScrollToSection: (id: string) => void;
  user: AuthUser | null;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  historyCount,
  onScrollToSection,
  user,
  onOpenAuth,
  onOpenAdmin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 glass-panel">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          onClick={() => onScrollToSection("hero")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
            <Disc3 className="w-5 h-5 text-white animate-spin-slow" />
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">
                SoundRip
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Audio Pro
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium hidden sm:block">
              YouTube & YT Music Converter
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
          <button
            onClick={() => onScrollToSection("hero")}
            className="hover:text-white transition-colors"
          >
            Converter
          </button>
          <button
            onClick={() => onScrollToSection("history")}
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            History
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-600/60 text-purple-200 text-xs font-semibold">
                {historyCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onScrollToSection("features")}
            className="hover:text-white transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => onScrollToSection("faq")}
            className="hover:text-white transition-colors"
          >
            FAQ
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Admin Engine Button (Only visible for Admins) */}
          {user?.role === "admin" && (
            <button
              onClick={onOpenAdmin}
              title="Admin Engine Switcher"
              className="px-2.5 py-1.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 text-purple-300 hover:text-white border border-purple-500/40 transition-all flex items-center gap-1.5 text-xs font-bold shadow-md shadow-purple-600/20 animate-pulse-glow"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Admin Engine</span>
            </button>
          )}

          {/* User Account / Auth Button */}
          {user ? (
            <div className="flex items-center gap-1.5 p-1 pl-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <span className="font-semibold text-white truncate max-w-[100px]">
                {user.username}
              </span>
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all text-xs font-semibold flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-purple-300" />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            title="Settings & API Configuration"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            100% Ad-Free
          </div>
        </div>
      </div>
    </header>
  );
};


"use client";

import React, { useState, useEffect } from "react";
import { X, Key, Check, Sliders, ShieldCheck, Server } from "lucide-react";
import { AUDIO_FORMATS } from "@/lib/youtube";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFormat: string;
  onSaveDefaultFormat: (format: string) => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  backendUrl: string;
  onSaveBackendUrl: (url: string) => void;
  autoDownload: boolean;
  onToggleAutoDownload: (val: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  defaultFormat,
  onSaveDefaultFormat,
  apiKey,
  onSaveApiKey,
  backendUrl,
  onSaveBackendUrl,
  autoDownload,
  onToggleAutoDownload,
}) => {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [backendInput, setBackendInput] = useState(backendUrl);
  const [selectedFormat, setSelectedFormat] = useState(defaultFormat);
  const [autoDl, setAutoDl] = useState(autoDownload);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setKeyInput(apiKey);
    setBackendInput(backendUrl);
    setSelectedFormat(defaultFormat);
    setAutoDl(autoDownload);
  }, [apiKey, backendUrl, defaultFormat, autoDownload, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    onSaveBackendUrl(backendInput.trim());
    onSaveDefaultFormat(selectedFormat);
    onToggleAutoDownload(autoDl);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel-glow p-6 sm:p-7 shadow-2xl border border-white/15">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">App Settings & Engine</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5 py-5 text-sm">
          {/* Default Format */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Default Audio Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AUDIO_FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFormat(f.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedFormat === f.id
                      ? "bg-purple-600/20 border-purple-500 text-white"
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  <p className="font-bold text-xs uppercase">{f.label}</p>
                  <p className="text-[10px] text-gray-400">{f.bitrate}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Auto Download Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="font-semibold text-white text-xs">Auto-trigger Download</p>
              <p className="text-[11px] text-gray-400">
                Immediately trigger file download once audio encoding is complete
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoDl(!autoDl)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                autoDl ? "bg-purple-600" : "bg-white/10"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  autoDl ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Private Backend Engine URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                Private Backend Engine URL (100% Ad-Free)
              </label>
              {backendInput ? (
                <span className="text-[10px] text-cyan-400 font-semibold">Configured</span>
              ) : (
                <span className="text-[10px] text-gray-400">Optional</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-2">
              Connect your private self-hosted converter (e.g. Koyeb, Render, Hugging Face, or localhost) for 100% permanent, ad-free downloads.
            </p>
            <input
              type="text"
              value={backendInput}
              onChange={(e) => setBackendInput(e.target.value)}
              placeholder="e.g. https://your-backend.koyeb.app or http://localhost:8080"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Optional RapidAPI Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                Custom RapidAPI Key (Optional)
              </label>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Free Engine Active
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-2">
              SoundRip includes a built-in conversion engine. You can optionally supply your own RapidAPI key for dedicated rate limits.
            </p>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Enter your RapidAPI key if applicable..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>


        {/* Modal actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-md shadow-purple-600/20 transition-all"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Saved!
              </>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

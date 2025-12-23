"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { parseOffset } from "@/lib/utils";

interface Settings {
  timezone: string;
  minTime: string;
  maxTime: string;
  hourlyRate?: number;
  smsMessage?: string;
}

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Cache settings globally to avoid multiple fetches
let settingsCache: Settings | null = null;
let settingsPromise: Promise<Settings | null> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(settingsCache);
  const [loading, setLoading] = useState(!settingsCache);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchSettings = async () => {
      // Check cache first
      const now = Date.now();
      if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        if (isMountedRef.current) {
          setSettings(settingsCache);
          setLoading(false);
        }
        return;
      }

      // If there's already a pending request, wait for it
      if (settingsPromise) {
        try {
          const cached = await settingsPromise;
          if (isMountedRef.current && cached) {
            setSettings(cached);
            setLoading(false);
          }
          return;
        } catch (err) {
          // Continue to fetch if promise failed
        }
      }

      // Create new fetch promise
      settingsPromise = (async () => {
        try {
          const response = await fetch("/api/settings");
          if (!response.ok) throw new Error("Failed to fetch settings");
          
          const data = await response.json();
          const settingsData: Settings = {
            timezone: parseOffset(data?.timezone || "UTC-7:00"),
            minTime: data?.min_time || "8:00 AM",
            maxTime: data?.max_time || "6:00 PM",
            hourlyRate: data?.hourly_rate,
            smsMessage: data?.sms_message,
          };

          // Update cache
          settingsCache = settingsData;
          cacheTimestamp = Date.now();

          if (isMountedRef.current) {
            setSettings(settingsData);
            setLoading(false);
            setError(null);
          }

          return settingsData;
        } catch (err) {
          console.error("Error fetching settings:", err);
          const defaultSettings: Settings = {
            timezone: parseOffset("UTC-7:00"),
            minTime: "8:00 AM",
            maxTime: "6:00 PM",
          };

          if (isMountedRef.current) {
            setSettings(defaultSettings);
            setLoading(false);
            setError("Failed to fetch settings");
          }

          return defaultSettings;
        } finally {
          settingsPromise = null;
        }
      })();

      await settingsPromise;
    };

    fetchSettings();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, error }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

// Helper to invalidate cache (call after updating settings)
export function invalidateSettingsCache() {
  settingsCache = null;
  cacheTimestamp = 0;
  settingsPromise = null;
}


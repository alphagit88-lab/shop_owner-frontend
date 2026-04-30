"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";
import { useAuth } from "./auth-context";

interface Settings {
  currency: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSetting: (key: string, value: string) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({ currency: "LKR" });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user) return;
    try {
      const res = await api.get("/settings");
      setSettings(res.data);
    } catch (error) {
      console.error("Failed to fetch settings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const updateSetting = async (key: string, value: string) => {
    try {
      await api.post("/settings", { key, value });
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error("Failed to update setting", error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

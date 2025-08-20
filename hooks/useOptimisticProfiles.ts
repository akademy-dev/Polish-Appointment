"use client";
import { useState, useEffect, useCallback } from "react";
import { Profile } from "@/models/profile";

const PROFILES_CHANGES_KEY = "profiles_changes";

interface ProfileChange {
  id: string;
  type: "customer" | "employee";
  action: "add" | "delete" | "update";
  data?: Profile;
  timestamp: number;
}

export const useOptimisticProfiles = (
  initialCustomers: Profile[],
  initialEmployees: Profile[]
) => {
  const [customers, setCustomers] = useState<Profile[]>(initialCustomers);
  const [employees, setEmployees] = useState<Profile[]>(initialEmployees);
  const [changes, setChanges] = useState<ProfileChange[]>([]);

  // Load optimistic changes from localStorage on mount
  useEffect(() => {
    try {
      const storedChanges = localStorage.getItem(PROFILES_CHANGES_KEY);
      if (storedChanges) {
        const parsedChanges: ProfileChange[] = JSON.parse(storedChanges);
        setChanges(parsedChanges);
        
        // Apply changes to initial data
        let optimisticCustomers = [...initialCustomers];
        let optimisticEmployees = [...initialEmployees];
        
        parsedChanges.forEach(change => {
          if (change.type === "customer") {
            if (change.action === "add" && change.data) {
              optimisticCustomers.push(change.data);
            } else if (change.action === "delete") {
              optimisticCustomers = optimisticCustomers.filter(c => c._id !== change.id);
            } else if (change.action === "update" && change.data) {
              optimisticCustomers = optimisticCustomers.map(c => 
                c._id === change.id ? change.data! : c
              );
            }
          } else if (change.type === "employee") {
            if (change.action === "add" && change.data) {
              optimisticEmployees.push(change.data);
            } else if (change.action === "delete") {
              optimisticEmployees = optimisticEmployees.filter(e => e._id !== change.id);
            } else if (change.action === "update" && change.data) {
              optimisticEmployees = optimisticEmployees.map(e => 
                e._id === change.id ? change.data! : e
              );
            }
          }
        });
        
        setCustomers(optimisticCustomers);
        setEmployees(optimisticEmployees);
      }
    } catch (error) {
      console.error("Error loading optimistic changes:", error);
    }
  }, [initialCustomers, initialEmployees]);

  // Save changes to localStorage
  const saveChanges = useCallback((newChanges: ProfileChange[]) => {
    try {
      localStorage.setItem(PROFILES_CHANGES_KEY, JSON.stringify(newChanges));
    } catch (error) {
      console.error("Error saving optimistic changes:", error);
    }
  }, []);

  // Add profile optimistically
  const addProfile = useCallback((profile: Profile, type: "customer" | "employee") => {
    const change: ProfileChange = {
      id: profile._id,
      type,
      action: "add",
      data: profile,
      timestamp: Date.now(),
    };

    const newChanges = [...changes, change];
    setChanges(newChanges);
    saveChanges(newChanges);
    
    if (type === "customer") {
      setCustomers(prev => [...prev, profile]);
    } else {
      setEmployees(prev => [...prev, profile]);
    }
  }, [changes, saveChanges]);

  // Delete profile optimistically
  const deleteProfile = useCallback((profileId: string, type: "customer" | "employee") => {
    const change: ProfileChange = {
      id: profileId,
      type,
      action: "delete",
      timestamp: Date.now(),
    };

    const newChanges = [...changes, change];
    setChanges(newChanges);
    saveChanges(newChanges);
    
    if (type === "customer") {
      setCustomers(prev => prev.filter(c => c._id !== profileId));
    } else {
      setEmployees(prev => prev.filter(e => e._id !== profileId));
    }
  }, [changes, saveChanges]);

  // Update profile optimistically
  const updateProfile = useCallback((profile: Profile, type: "customer" | "employee") => {
    const change: ProfileChange = {
      id: profile._id,
      type,
      action: "update",
      data: profile,
      timestamp: Date.now(),
    };

    const newChanges = [...changes, change];
    setChanges(newChanges);
    saveChanges(newChanges);
    
    if (type === "customer") {
      setCustomers(prev => prev.map(c => c._id === profile._id ? profile : c));
    } else {
      setEmployees(prev => prev.map(e => e._id === profile._id ? profile : e));
    }
  }, [changes, saveChanges]);

  // Clear changes after successful sync
  const clearChanges = useCallback(() => {
    setChanges([]);
    localStorage.removeItem(PROFILES_CHANGES_KEY);
  }, []);

  // Remove specific change after successful sync
  const removeChange = useCallback((changeId: string) => {
    const newChanges = changes.filter(c => c.id !== changeId);
    setChanges(newChanges);
    saveChanges(newChanges);
  }, [changes, saveChanges]);

  // Sync with server data
  const syncWithServer = useCallback((
    serverCustomers: Profile[],
    serverEmployees: Profile[]
  ) => {
    setCustomers(serverCustomers);
    setEmployees(serverEmployees);
    // Clear changes after successful sync
    clearChanges();
  }, [clearChanges]);

  return {
    customers,
    employees,
    changes,
    addProfile,
    deleteProfile,
    updateProfile,
    clearChanges,
    removeChange,
    syncWithServer,
  };
};

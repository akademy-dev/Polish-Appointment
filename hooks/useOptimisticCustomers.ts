"use client";
import { useState, useEffect, useCallback } from "react";
import { Profile } from "@/models/profile";
import { OptimisticStorage, OptimisticChange } from "@/lib/optimistic-storage";

interface CustomerChange extends OptimisticChange {
  data?: Profile;
}

export const useOptimisticCustomers = (initialCustomers: Profile[]) => {
  const [customers, setCustomers] = useState<Profile[]>(initialCustomers);
  const [changes, setChanges] = useState<CustomerChange[]>([]);

  // Load optimistic changes from localStorage on mount
  useEffect(() => {
    const storedChanges = OptimisticStorage.loadChanges("CUSTOMERS") as CustomerChange[];
    if (storedChanges.length > 0) {
      setChanges(storedChanges);
      
      // Apply changes to initial data
      let optimisticCustomers = [...initialCustomers];
      
      storedChanges.forEach(change => {
        if (change.action === "add" && change.data) {
          optimisticCustomers.push(change.data);
        } else if (change.action === "delete") {
          optimisticCustomers = optimisticCustomers.filter(c => c._id !== change.id);
        } else if (change.action === "update" && change.data) {
          optimisticCustomers = optimisticCustomers.map(c => 
            c._id === change.id ? change.data! : c
          );
        }
      });
      
      setCustomers(optimisticCustomers);
    }
  }, [initialCustomers]);

  // Save changes to localStorage
  const saveChanges = useCallback((newChanges: CustomerChange[]) => {
    OptimisticStorage.saveChanges("CUSTOMERS", newChanges);
  }, []);

  // Add customer optimistically
  const addCustomer = useCallback((customer: Profile) => {
    const change: CustomerChange = {
      id: customer._id,
      action: "add",
      data: customer,
      timestamp: Date.now(),
    };

    const newChanges = [...changes, change];
    setChanges(newChanges);
    saveChanges(newChanges);
    
    setCustomers(prev => [...prev, customer]);
  }, [changes, saveChanges]);

  // Delete customer optimistically
  const deleteCustomer = useCallback((customerId: string) => {
    const change: CustomerChange = {
      id: customerId,
      action: "delete",
      timestamp: Date.now(),
    };

    const newChanges = [...changes, change];
    setChanges(newChanges);
    saveChanges(newChanges);
    
    setCustomers(prev => prev.filter(c => c._id !== customerId));
  }, [changes, saveChanges]);

  // Update customer optimistically
  const updateCustomer = useCallback((customer: Profile) => {
    const change: CustomerChange = {
      id: customer._id,
      action: "update",
      data: customer,
      timestamp: Date.now(),
    };

    const newChanges = [...changes, change];
    setChanges(newChanges);
    saveChanges(newChanges);
    
    setCustomers(prev => prev.map(c => c._id === customer._id ? customer : c));
  }, [changes, saveChanges]);

  // Clear changes after successful sync
  const clearChanges = useCallback(() => {
    setChanges([]);
    OptimisticStorage.clearChanges("CUSTOMERS");
  }, []);

  // Remove specific change after successful sync
  const removeChange = useCallback((changeId: string) => {
    const newChanges = changes.filter(c => c.id !== changeId);
    setChanges(newChanges);
    saveChanges(newChanges);
  }, [changes, saveChanges]);

  // Sync with server data
  const syncWithServer = useCallback((serverCustomers: Profile[]) => {
    setCustomers(serverCustomers);
    // Clear changes after successful sync
    clearChanges();
  }, [clearChanges]);

  return {
    customers,
    changes,
    addCustomer,
    deleteCustomer,
    updateCustomer,
    clearChanges,
    removeChange,
    syncWithServer,
  };
};

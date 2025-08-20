"use client";
import { useState, useEffect, useCallback } from "react";
import { Profile } from "@/models/profile";

const EMPLOYEES_STORAGE_KEY = "optimistic_employees";
const EMPLOYEES_CHANGES_KEY = "employees_changes";

interface EmployeeChange {
  id: string;
  action: "add" | "delete" | "update";
  data?: Profile;
  timestamp: number;
}

export const useOptimisticEmployees = (initialEmployees: Profile[]) => {
  const [employees, setEmployees] = useState<Profile[]>(initialEmployees);
  const [changes, setChanges] = useState<EmployeeChange[]>([]);

  // Load optimistic changes from localStorage on mount
  useEffect(() => {
    try {
      const storedChanges = localStorage.getItem(EMPLOYEES_CHANGES_KEY);
      if (storedChanges) {
        const parsedChanges: EmployeeChange[] = JSON.parse(storedChanges);
        setChanges(parsedChanges);
        
        // Apply changes to initial data
        let optimisticEmployees = [...initialEmployees];
        
        parsedChanges.forEach(change => {
          if (change.action === "add" && change.data) {
            optimisticEmployees.push(change.data);
          } else if (change.action === "delete") {
            optimisticEmployees = optimisticEmployees.filter(e => e._id !== change.id);
          } else if (change.action === "update" && change.data) {
            optimisticEmployees = optimisticEmployees.map(e => 
              e._id === change.id ? change.data! : e
            );
          }
        });
        
        setEmployees(optimisticEmployees);
      }
    } catch (error) {
      console.error("Error loading optimistic changes:", error);
    }
  }, [initialEmployees]);

  // Save changes to localStorage
  const saveChanges = useCallback((newChanges: EmployeeChange[]) => {
    try {
      localStorage.setItem(EMPLOYEES_CHANGES_KEY, JSON.stringify(newChanges));
    } catch (error) {
      console.error("Error saving optimistic changes:", error);
    }
  }, []);

  // Add employee optimistically
  const addEmployee = useCallback((employee: Profile) => {
    const change: EmployeeChange = {
      id: employee._id,
      action: "add",
      data: employee,
      timestamp: Date.now(),
    };

    const newChanges = [...changes, change];
    setChanges(newChanges);
    saveChanges(newChanges);
    
    setEmployees(prev => [...prev, employee]);
  }, [changes, saveChanges]);

  // Delete employee optimistically
  const deleteEmployee = useCallback((employeeId: string) => {
    const change: EmployeeChange = {
      id: employeeId,
      action: "delete",
      timestamp: Date.now(),
    };

    const newChanges = [...changes, change];
    setChanges(newChanges);
    saveChanges(newChanges);
    
    setEmployees(prev => prev.filter(e => e._id !== employeeId));
  }, [changes, saveChanges]);

  // Update employee optimistically
  const updateEmployee = useCallback((employee: Profile) => {
    const change: EmployeeChange = {
      id: employee._id,
      action: "update",
      data: employee,
      timestamp: Date.now(),
    };

    const newChanges = [...changes, change];
    setChanges(newChanges);
    saveChanges(newChanges);
    
    setEmployees(prev => prev.map(e => e._id === employee._id ? employee : e));
  }, [changes, saveChanges]);

  // Clear changes after successful sync
  const clearChanges = useCallback(() => {
    setChanges([]);
    localStorage.removeItem(EMPLOYEES_CHANGES_KEY);
  }, []);

  // Remove specific change after successful sync
  const removeChange = useCallback((changeId: string) => {
    const newChanges = changes.filter(c => c.id !== changeId);
    setChanges(newChanges);
    saveChanges(newChanges);
  }, [changes, saveChanges]);

  // Sync with server data
  const syncWithServer = useCallback((serverEmployees: Profile[]) => {
    setEmployees(serverEmployees);
    // Clear changes after successful sync
    clearChanges();
  }, [clearChanges]);

  return {
    employees,
    changes,
    addEmployee,
    deleteEmployee,
    updateEmployee,
    clearChanges,
    removeChange,
    syncWithServer,
  };
};

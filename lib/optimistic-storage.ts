// Utility functions for managing optimistic updates in localStorage

export interface OptimisticChange {
  id: string;
  type?: string;
  action: "add" | "delete" | "update";
  data?: any;
  timestamp: number;
}

const STORAGE_KEYS = {
  CUSTOMERS: "customers_changes",
  EMPLOYEES: "employees_changes",
  PROFILES: "profiles_changes",
  APPOINTMENTS: "appointments_changes",
  SERVICES: "services_changes",
} as const;

export class OptimisticStorage {
  private static getStorageKey(type: keyof typeof STORAGE_KEYS): string {
    return STORAGE_KEYS[type];
  }

  static saveChanges(type: keyof typeof STORAGE_KEYS, changes: OptimisticChange[]): void {
    try {
      const key = this.getStorageKey(type);
      localStorage.setItem(key, JSON.stringify(changes));
    } catch (error) {
      console.error(`Error saving optimistic changes for ${type}:`, error);
    }
  }

  static loadChanges(type: keyof typeof STORAGE_KEYS): OptimisticChange[] {
    try {
      const key = this.getStorageKey(type);
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error(`Error loading optimistic changes for ${type}:`, error);
      return [];
    }
  }

  static clearChanges(type: keyof typeof STORAGE_KEYS): void {
    try {
      const key = this.getStorageKey(type);
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error clearing optimistic changes for ${type}:`, error);
    }
  }

  static clearAllChanges(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error("Error clearing all optimistic changes:", error);
    }
  }

  static getChangesSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    
    try {
      Object.entries(STORAGE_KEYS).forEach(([type, key]) => {
        const stored = localStorage.getItem(key);
        if (stored) {
          const changes = JSON.parse(stored);
          summary[type] = changes.length;
        } else {
          summary[type] = 0;
        }
      });
    } catch (error) {
      console.error("Error getting changes summary:", error);
    }
    
    return summary;
  }

  static hasPendingChanges(): boolean {
    try {
      return Object.values(STORAGE_KEYS).some(key => {
        const stored = localStorage.getItem(key);
        if (stored) {
          const changes = JSON.parse(stored);
          return changes.length > 0;
        }
        return false;
      });
    } catch (error) {
      console.error("Error checking pending changes:", error);
      return false;
    }
  }

  static getTotalPendingChanges(): number {
    try {
      let total = 0;
      Object.values(STORAGE_KEYS).forEach(key => {
        const stored = localStorage.getItem(key);
        if (stored) {
          const changes = JSON.parse(stored);
          total += changes.length;
        }
      });
      return total;
    } catch (error) {
      console.error("Error getting total pending changes:", error);
      return 0;
    }
  }

  // Utility method to add a change
  static addChange(
    type: keyof typeof STORAGE_KEYS,
    change: Omit<OptimisticChange, "timestamp">
  ): void {
    const changes = this.loadChanges(type);
    const newChange: OptimisticChange = {
      ...change,
      timestamp: Date.now(),
    };
    changes.push(newChange);
    this.saveChanges(type, changes);
  }

  // Utility method to remove a specific change
  static removeChange(type: keyof typeof STORAGE_KEYS, changeId: string): void {
    const changes = this.loadChanges(type);
    const filteredChanges = changes.filter(change => change.id !== changeId);
    this.saveChanges(type, filteredChanges);
  }

  // Utility method to get changes older than a certain time
  static getOldChanges(type: keyof typeof STORAGE_KEYS, maxAgeMs: number): OptimisticChange[] {
    const changes = this.loadChanges(type);
    const now = Date.now();
    return changes.filter(change => now - change.timestamp > maxAgeMs);
  }

  // Utility method to clean up old changes
  static cleanupOldChanges(type: keyof typeof STORAGE_KEYS, maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const changes = this.loadChanges(type);
    const now = Date.now();
    const freshChanges = changes.filter(change => now - change.timestamp <= maxAgeMs);
    this.saveChanges(type, freshChanges);
  }
}

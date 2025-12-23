import { supabase } from "@/lib/supabase";

export interface Setting {
  id: string;
  timezone?: string;
  min_time?: string;
  max_time?: string;
  sms_message?: string;
  hourly_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export const getSettings = async (): Promise<Setting | null> => {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      // If no settings exist, return null
      if (error.code === "PGRST116") {
        return null;
      }
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
};

export const updateSettings = async (
  id: string,
  updates: Partial<Setting>
): Promise<Setting | null> => {
  try {
    const { data, error } = await supabase
      .from("settings")
      .update({
        ...updates,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error updating settings:", error);
    return null;
  }
};

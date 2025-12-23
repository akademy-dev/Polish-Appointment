import { supabase } from "@/lib/supabase";

export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase.rpc("get_all_categories");

    if (error) {
      console.error("Error calling get_all_categories RPC:", error);
      return [];
    }

    // RPC returns array with id and name
    return (data || []) as Category[];
  } catch (error) {
    console.error("Error in getCategories:", error);
    return [];
  }
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
};

export const createCategory = async (
  name: string
): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .insert({ name })
      .select()
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
};

export const updateCategory = async (
  id: string,
  name: string
): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

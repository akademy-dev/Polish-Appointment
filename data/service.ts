import { supabase } from "@/lib/supabase";

export interface Service {
  id: string;
  _id?: string; // For backward compatibility
  name: string;
  price: number;
  duration: number;
  caterogy_id: string | null;
  created_at?: string;
  category?: {
    id: string;
    _id?: string; // For backward compatibility
    name: string;
  };
}

export interface ServiceWithCategory {
  id: string;
  _id: string; // For backward compatibility
  name: string;
  price: number;
  duration: number;
  caterogy_id: string | null;
  created_at?: string;
  category: {
    id: string;
    _id: string; // For backward compatibility
    name: string;
  };
}

export interface ServicesQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  searchTerm?: string;
}

export interface ServicesResponse {
  data: ServiceWithCategory[];
  total: number;
}

export const getServices = async (
  params: ServicesQueryParams = {}
): Promise<ServicesResponse> => {
  try {
    const { page = 1, limit = 20, categoryId = "", searchTerm = "" } = params;

    // Calculate offset for pagination
    const offset_val = (page - 1) * limit;
    const limit_val = limit;
    const p_category_id = categoryId || null;
    const p_search_term = searchTerm.trim() || null;

    // Call RPC function
    const { data, error } = await supabase.rpc("get_services", {
      limit_val,
      offset_val,
      p_category_id,
      p_search_term,
    });

    if (error) {
      console.error("Error calling get_services RPC:", error);
      return { data: [], total: 0 };
    }

    // The RPC returns an object with data array and total_count
    const rpcResponse = data as { data: any[]; total_count: number } | null;

    if (!rpcResponse) {
      return { data: [], total: 0 };
    }

    // Transform data to match expected format
    const services: ServiceWithCategory[] = (rpcResponse.data || []).map(
      (service) => ({
        id: service.id,
        _id: service.id, // Keep _id for backward compatibility
        name: service.name,
        price: service.price,
        duration: service.duration,
        caterogy_id: service.category_id,
        created_at: service.created_at,
        category:
          service.category_id && service.category_name
            ? {
              id: service.category_id,
              _id: service.category_id, // Keep _id for backward compatibility
              name: service.category_name,
            }
            : undefined,
      })
    ) as ServiceWithCategory[];

    return {
      data: services,
      total: rpcResponse.total_count || 0,
    };
  } catch (error) {
    console.error("Error in getServices:", error);
    return { data: [], total: 0 };
  }
};

export const getAllServices = async (): Promise<ServiceWithCategory[]> => {
  try {
    // Fetch all services with a very large limit, or use a separate query
    // Since RPC get_services supports pagination, we can use a large limit
    const result = await getServices({
      page: 1,
      limit: 10000, // Large limit to get all services
      categoryId: "",
      searchTerm: "",
    });

    return result.data || [];
  } catch (error) {
    console.error("Error in getAllServices:", error);
    return [];
  }
};

export const getServiceById = async (
  id: string
): Promise<ServiceWithCategory | null> => {
  try {
    const { data: rpcData, error } = await supabase.rpc("get_service_by_id", {
      p_id: id,
    });

    if (error) {
      console.error("[RPC] ❌ getServiceById error:", error);
      return null;
    }

    if (!rpcData) {
      return null;
    }

    const data = rpcData as any;

    return {
      id: data.id,
      _id: data.id,
      name: data.name,
      price: data.price,
      duration: data.duration,
      caterogy_id: data.caterogy_id,
      created_at: data.created_at,
      category:
        data.category_id && data.category_name
          ? {
            id: data.category_id,
            _id: data.category_id,
            name: data.category_name,
          }
          : undefined,
    } as ServiceWithCategory;
  } catch (error) {
    return null;
  }
};

export const createService = async (
  name: string,
  price: number,
  duration: number,
  categoryId: string | null
): Promise<Service | null> => {
  try {
    const { data, error } = await supabase
      .from("services")
      .insert({
        name,
        price,
        duration,
        caterogy_id: categoryId || null,
      })
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

export const updateService = async (
  id: string,
  updates: {
    name?: string;
    price?: number;
    duration?: number;
    categoryId?: string | null;
  }
): Promise<Service | null> => {
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    // Always update categoryId if provided (even if null)
    if (updates.categoryId !== undefined) {
      updateData.caterogy_id = updates.categoryId || null;
    }

    const { data, error } = await supabase
      .from("services")
      .update(updateData)
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

export const deleteService = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

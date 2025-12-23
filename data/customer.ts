import { supabase } from "@/lib/supabase";

export interface Customer {
  id: string;
  _id?: string; // For backward compatibility
  _type?: "customer"; // For backward compatibility
  first_name?: string;
  last_name?: string;
  phone?: string;
  note?: string;
  created_at?: string;
}

export interface CustomersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CustomersResponse {
  data: Customer[];
  total: number;
}

export const getCustomers = async (
  params: CustomersQueryParams = {}
): Promise<CustomersResponse> => {
  try {
    const { page = 1, limit = 20, search = "" } = params;

    // Build query
    let query = supabase
      .from("customers")
      .select("*", { count: "exact" });

    // Apply search filter
    if (search && search.trim()) {
      const searchTrimmed = search.trim().replace(/%/g, "\\%").replace(/_/g, "\\_");
      const searchTerm = `%${searchTrimmed}%`;
      
      // Split search term by spaces to handle full name searches like "A Nguyen"
      const searchParts = searchTrimmed.split(/\s+/).filter(part => part.length > 0);
      
      if (searchParts.length >= 2) {
        // If search has multiple parts (e.g., "A Nguyen")
        // Search for: first_name matches first part AND last_name matches last part
        // This requires using AND condition which Supabase supports by chaining filters
        const firstPart = `%${searchParts[0]}%`;
        const lastPart = `%${searchParts[searchParts.length - 1]}%`;
        
        // Apply AND condition: first_name contains first part AND last_name contains last part
        query = query
          .ilike("first_name", firstPart)
          .ilike("last_name", lastPart);
      } else {
        // Single word search - search in all fields using OR
        query = query.or(
          `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},phone.ilike.${searchTerm}`
        );
      }
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Order by created_at desc
    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return { data: [], total: 0 };
    }

    // Transform data to match expected format
    const customers: Customer[] = (data || []).map((cust) => ({
      id: cust.id,
      _id: cust.id, // For backward compatibility
      _type: "customer", // For backward compatibility
      first_name: cust.first_name,
      last_name: cust.last_name,
      firstName: cust.first_name, // For backward compatibility
      lastName: cust.last_name, // For backward compatibility
      phone: cust.phone,
      note: cust.note,
      created_at: cust.created_at,
      _createdAt: cust.created_at, // For backward compatibility
    }));

    return {
      data: customers,
      total: count || 0,
    };
  } catch (error) {
    return { data: [], total: 0 };
  }
};

export const getAllCustomers = async (
  search?: string
): Promise<Customer[]> => {
  try {
    // Build query
    let query = supabase
      .from("customers")
      .select("*");

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchTrimmed = search.trim().replace(/%/g, "\\%").replace(/_/g, "\\_");
      const searchTerm = `%${searchTrimmed}%`;
      
      // Split search term by spaces to handle full name searches like "A Nguyen"
      const searchParts = searchTrimmed.split(/\s+/).filter(part => part.length > 0);
      
      if (searchParts.length >= 2) {
        // If search has multiple parts (e.g., "A Nguyen")
        // Search for: first_name matches first part AND last_name matches last part
        // This requires using AND condition which Supabase supports by chaining filters
        const firstPart = `%${searchParts[0]}%`;
        const lastPart = `%${searchParts[searchParts.length - 1]}%`;
        
        // Apply AND condition: first_name contains first part AND last_name contains last part
        query = query
          .ilike("first_name", firstPart)
          .ilike("last_name", lastPart);
      } else {
        // Single word search - search in all fields using OR
        query = query.or(
          `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},phone.ilike.${searchTerm}`
        );
      }
    }

    // Order by created_at desc
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      return [];
    }

    // Transform data to match expected format
    const customers: Customer[] = (data || []).map((cust) => ({
      id: cust.id,
      _id: cust.id,
      _type: "customer",
      first_name: cust.first_name,
      last_name: cust.last_name,
      firstName: cust.first_name,
      lastName: cust.last_name,
      phone: cust.phone,
      note: cust.note,
      created_at: cust.created_at,
      _createdAt: cust.created_at,
    }));

    return customers;
  } catch (error) {
    return [];
  }
};

export const getCustomerById = async (
  id: string
): Promise<Customer | null> => {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      _id: data.id,
      _type: "customer",
      first_name: data.first_name,
      last_name: data.last_name,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      note: data.note,
      created_at: data.created_at,
      _createdAt: data.created_at,
    };
  } catch (error) {
    return null;
  }
};

export const createCustomer = async (
  firstName: string,
  lastName: string,
  phone: string | null,
  note: string | null
): Promise<Customer | null> => {
  try {
    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        note: note || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create customer: ${error.message}`);
    }

    if (!customer || !customer.id) {
      throw new Error("Failed to create customer: No ID returned");
    }

    return {
      id: customer.id,
      _id: customer.id,
      _type: "customer",
      first_name: customer.first_name,
      last_name: customer.last_name,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      note: customer.note,
      created_at: customer.created_at,
    };
  } catch (error) {
    throw error;
  }
};

export const updateCustomer = async (
  id: string,
  updates: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    note?: string | null;
  }
): Promise<Customer | null> => {
  try {
    const updateData: any = {};
    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.note !== undefined) updateData.note = updates.note || null;

    const { data: customer, error } = await supabase
      .from("customers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update customer: ${error.message}`);
    }

    if (!customer) {
      throw new Error("Failed to update customer: No data returned");
    }

    return {
      id: customer.id,
      _id: customer.id,
      _type: "customer",
      first_name: customer.first_name,
      last_name: customer.last_name,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      note: customer.note,
      created_at: customer.created_at,
    };
  } catch (error) {
    throw error;
  }
};

export const deleteCustomer = async (id: string): Promise<boolean> => {
  try {
    // Note: With CASCADE delete in Supabase, related records will be automatically deleted
    // TODO: Add appointment reference check when appointments are migrated to Supabase
    
    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};


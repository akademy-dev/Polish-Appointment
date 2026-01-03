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

    const { data: rpcData, error } = await supabase.rpc("get_customers_paginated", {
      p_page: page,
      p_limit: limit,
      p_search_term: search || null,
    });

    if (error) {
      console.error("[RPC] ❌ getCustomers error:", error);
      return { data: [], total: 0 };
    }

    // RPC returns { data: [...], total: N }
    const result = rpcData as { data: any[]; total: number };
    const rawCustomers = result.data || [];
    const total = result.total || 0;

    // Transform data to match expected format
    const customers: Customer[] = rawCustomers.map((cust: any) => ({
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

    return {
      data: customers,
      total: total,
    };
  } catch (error) {
    return { data: [], total: 0 };
  }
};

export const getAllCustomers = async (
  search?: string
): Promise<Customer[]> => {
  try {
    const { data: rpcData, error } = await supabase.rpc("get_all_customers", {
      p_search_term: search || null,
    });

    if (error) {
      console.error("[RPC] ❌ getAllCustomers error:", error);
      return [];
    }

    // RPC returns setof json
    const rawCustomers = (rpcData || []) as any[];

    // Transform data to match expected format
    const customers: Customer[] = rawCustomers.map((cust: any) => ({
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
    const { data: rpcData, error } = await supabase.rpc("get_customer_by_id", {
      p_id: id,
    });

    if (error) {
      console.error("[RPC] ❌ getCustomerById error:", error);
      return null;
    }

    if (!rpcData) {
      return null;
    }

    const data = rpcData as any;

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


import { NextResponse } from "next/server";
import { getAllCustomers } from "@/data/customer";
import { getCustomerById } from "@/data/customer";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const id = searchParams.get("id");
    
    // If ID is provided, fetch single customer
    if (id) {
      const customer = await getCustomerById(id);
      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(customer);
    }
    
    // Otherwise fetch all customers
    const customers = await getAllCustomers(search || undefined);
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}


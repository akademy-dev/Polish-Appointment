"use server";

import { revalidatePath } from "next/cache";
import { writeClient } from "@/sanity/lib/write-client";
import * as XLSX from "xlsx";

interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
  errors?: string[];
}

interface CustomerData {
  firstName: string;
  lastName: string;
  phone: string;
  note?: string;
}

export async function importCustomers(formData: FormData): Promise<ImportResult> {
  try {
    const file = formData.get("file") as File;
    
    if (!file) {
      return {
        success: false,
        message: "No file provided",
      };
    }

    // Read file content based on file type
    let headers: string[] = [];
    let dataRows: any[] = [];

    if (file.type === "text/csv") {
      // Handle CSV files
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        return {
          success: false,
          message: "File must contain at least a header row and one data row",
        };
      }

      headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      dataRows = lines.slice(1).map(line => {
        const values = line.split(",").map((v: string) => v.trim().replace(/"/g, ""));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        return row;
      });
    } else {
      // Handle Excel files
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        return {
          success: false,
          message: "File must contain at least a header row and one data row",
        };
      }

      headers = (jsonData[0] as string[]).map(h => h.trim());
      dataRows = jsonData.slice(1).map((row: any) => {
        const rowData: any = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index] || "";
        });
        return rowData;
      });
    }

    // Validate headers
    const requiredHeaders = ["firstName", "lastName", "phone"];
    const headerMapping: { [key: string]: string } = {};
    
    // Map common header variations
    const headerVariations = {
      firstName: ["firstName", "First Name", "first_name", "First Name", "Tên"],
      lastName: ["lastName", "Last Name", "last_name", "Last Name", "Họ"],
      phone: ["phone", "Phone", "phone_number", "Phone Number", "Số điện thoại"],
      note: ["note", "Note", "notes", "Notes", "Ghi chú"],
    };

    // Find matching headers
    for (const [field, variations] of Object.entries(headerVariations)) {
      const foundHeader = headers.find(header => 
        variations.some(variation => 
          header.toLowerCase() === variation.toLowerCase()
        )
      );
      if (foundHeader) {
        headerMapping[foundHeader] = field;
      }
    }

    // Check if required headers are found
    const missingHeaders = requiredHeaders.filter(field => 
      !Object.values(headerMapping).includes(field)
    );

    if (missingHeaders.length > 0) {
      return {
        success: false,
        message: `Missing required headers: ${missingHeaders.join(", ")}. Please ensure your file has columns for First Name, Last Name, and Phone.`,
      };
    }

    // Parse and validate data
    const customers: CustomerData[] = [];
    const errors: string[] = [];
    let importedCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      if (!row || typeof row !== "object") {
        errors.push(`Row ${i + 2}: Invalid data format`);
        continue;
      }

      const mappedRow: any = {};
      headers.forEach((header) => {
        const field = headerMapping[header];
        if (field) {
          mappedRow[field] = row[header] || "";
        }
      });

      // Validate required fields
      if (!mappedRow.firstName?.trim()) {
        errors.push(`Row ${i + 2}: First name is required`);
        continue;
      }

      if (!mappedRow.lastName?.trim()) {
        errors.push(`Row ${i + 2}: Last name is required`);
        continue;
      }

      if (!mappedRow.phone?.trim()) {
        errors.push(`Row ${i + 2}: Phone number is required`);
        continue;
      }

      // Basic phone validation
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(mappedRow.phone)) {
        errors.push(`Row ${i + 2}: Invalid phone number format`);
        continue;
      }

      customers.push({
        firstName: mappedRow.firstName.trim(),
        lastName: mappedRow.lastName.trim(),
        phone: mappedRow.phone.trim(),
        note: mappedRow.note?.trim() || "",
      });
    }

    if (customers.length === 0) {
      return {
        success: false,
        message: "No valid customer data found in the file",
        errors,
      };
    }

    // Import customers to Sanity
    const importPromises = customers.map(async (customer) => {
      try {
        const result = await writeClient.create({
          _type: "customer",
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          note: customer.note,
        });
        return { success: true, id: result._id };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
      }
    });

    const results = await Promise.all(importPromises);
    const successfulImports = results.filter(r => r.success);
    const failedImports = results.filter(r => !r.success);

    importedCount = successfulImports.length;

    // Add import errors to the errors array
    failedImports.forEach((failed, index) => {
      errors.push(`Import failed for customer ${customers[index].firstName} ${customers[index].lastName}: ${failed.error}`);
    });

    // Revalidate the customers page
    revalidatePath("/customers");

    if (importedCount === 0) {
      return {
        success: false,
        message: "Failed to import any customers",
        errors,
      };
    }

    const message = `Successfully imported ${importedCount} customer${importedCount > 1 ? "s" : ""}`;
    if (errors.length > 0) {
      return {
        success: true,
        message: `${message} with ${errors.length} error${errors.length > 1 ? "s" : ""}`,
        importedCount,
        errors,
      };
    }

    return {
      success: true,
      message,
      importedCount,
    };

  } catch (error) {
    console.error("Customer import error:", error);
    return {
      success: false,
      message: "An error occurred during import",
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

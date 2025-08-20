"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { customerImportSchema, CustomerImportValues } from "@/lib/validation";
import CustomerImportTemplate from "@/components/CustomerImportTemplate";
import { Alert, AlertDescription } from "../ui/alert";
import { importCustomers } from "@/actions/customer-import";

interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
  errors?: string[];
}

const CustomerImportForm = ({
  className,
  onSuccess,
}: {
  className?: string;
  onSuccess?: () => void;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const form = useForm<CustomerImportValues>({
    resolver: zodResolver(customerImportSchema),
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset previous results
    setImportResult(null);
    setPreviewData([]);

    // Validate file type
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      setImportResult({
        success: false,
        message: "Please select a valid CSV or Excel file",
      });
      return;
    }

    // Preview file content
    try {
      let previewRows: any[] = [];

      if (file.type === "text/csv") {
        // Handle CSV files
        const text = await file.text();
        const lines = text.split("\n").filter(line => line.trim());
        
        if (lines.length === 0) {
          setImportResult({
            success: false,
            message: "File is empty",
          });
          return;
        }

        const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
        previewRows = lines.slice(1, 6).map(line => {
          const values = line.split(",").map((v: string) => v.trim().replace(/"/g, ""));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });
          return row;
        });
      } else {
        // Handle Excel files - we'll skip preview for now
        form.setValue("file", file);
        return;
      }

      setPreviewData(previewRows);
      form.setValue("file", file);
    } catch (error) {
      setImportResult({
        success: false,
        message: "Error reading file",
      });
    }
  };

  const onSubmit = async (data: CustomerImportValues) => {
    if (!data.file) return;

    setIsSubmitting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", data.file);

      const result = await importCustomers(formData);
      setImportResult(result);

      if (result.success) {
        form.reset();
        setPreviewData([]);
        onSuccess?.();
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: "An error occurred during import",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Customers
        </CardTitle>
        <CardDescription>
          Upload a CSV or Excel file to import customer data. The file should have columns for: First Name, Last Name, Phone, and optionally Note.
        </CardDescription>
        <div className="flex justify-end">
          <CustomerImportTemplate />
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>File</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            {/* Preview Section */}
            {previewData.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Preview (first 5 rows):</h4>
                <div className="border rounded-md p-3 bg-muted/50">
                  <div className="grid grid-cols-4 gap-2 text-xs font-medium mb-2">
                    <div>First Name</div>
                    <div>Last Name</div>
                    <div>Phone</div>
                    <div>Note</div>
                  </div>
                  {previewData.map((row, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 text-xs">
                      <div className="truncate">{row.firstName || row["First Name"] || ""}</div>
                      <div className="truncate">{row.lastName || row["Last Name"] || ""}</div>
                      <div className="truncate">{row.phone || row.Phone || ""}</div>
                      <div className="truncate">{row.note || row.Note || ""}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Result Alert */}
            {importResult && (
              <Alert className={cn(
                importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
              )}>
                {importResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={cn(
                  importResult.success ? "text-green-800" : "text-red-800"
                )}>
                  {importResult.message}
                  {importResult.importedCount !== undefined && (
                    <span className="block mt-1">
                      Successfully imported {importResult.importedCount} customers.
                    </span>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <div className="font-medium">Errors:</div>
                      <ul className="list-disc list-inside text-sm">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || !form.getValues("file")}>
                {isSubmitting ? "Importing..." : "Import Customers"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CustomerImportForm;

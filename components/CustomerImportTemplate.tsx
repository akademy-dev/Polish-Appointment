"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const CustomerImportTemplate = () => {
  const downloadTemplate = () => {
    const csvContent = `firstName,lastName,phone,note
John,Doe,+1234567890,Regular customer
Jane,Smith,+0987654321,Prefers morning appointments
Mike,Johnson,+1122334455,Allergic to certain products`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customer-import-template.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" onClick={downloadTemplate}>
        <Download className="h-4 w-4 mr-2" />
        Download Template
      </Button>
    </div>
  );
};

export default CustomerImportTemplate;

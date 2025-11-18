"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import SearchForm from "@/components/forms/SearchForm";
import CustomerImportForm from "@/components/forms/CustomerImportForm";
import { useRouter } from "next/navigation";

const CustomerPageHeader = () => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const router = useRouter();

  const handleImportSuccess = () => {
    setIsImportDialogOpen(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex-1 max-w-md">
        <SearchForm action="/customers" />
      </div>
      
      <div className="flex items-center gap-2">
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Customers</DialogTitle>
            </DialogHeader>
            <CustomerImportForm onSuccess={handleImportSuccess} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CustomerPageHeader;

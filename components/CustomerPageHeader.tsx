"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Plus, Trash2 } from "lucide-react";
import SearchForm from "@/components/forms/SearchForm";
import CustomerImportForm from "@/components/forms/CustomerImportForm";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ConfirmDialog";
import { deleteAllCustomers } from "@/lib/actions";
import { toast } from "sonner";

const CustomerPageHeader = () => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleImportSuccess = () => {
    setIsImportDialogOpen(false);
    router.refresh();
  };

  const handleAddCustomer = () => {
    // Navigate to add customer page or open add customer dialog
    // For now, we'll just refresh the page
    router.refresh();
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAllCustomers();
      if (result.status === "SUCCESS") {
        toast.success("Success", {
          description: `All customers deleted successfully${result.count ? ` (${result.count} customers)` : ""}`,
        });
        setShowDeleteAllConfirm(false);
        router.refresh();
      } else {
        toast.error("Error", {
          description: result.error || "Failed to delete all customers",
        });
      }
    } catch (error) {
      console.error("Error deleting all customers:", error);
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsDeleting(false);
    }
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

        <Button 
          variant="destructive" 
          onClick={() => setShowDeleteAllConfirm(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete All
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteAllConfirm}
        onOpenChange={setShowDeleteAllConfirm}
        title="Delete All Customers"
        description="Are you sure you want to delete ALL customers? This will also delete all appointments associated with these customers. This action cannot be undone."
        onConfirm={handleDeleteAll}
        confirmText={isDeleting ? "Deleting..." : "Delete All"}
        disabled={isDeleting}
      />
    </div>
  );
};

export default CustomerPageHeader;

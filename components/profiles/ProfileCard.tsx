"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { History, Trash2, Pencil } from "lucide-react";
import {
  Profile,
  getProfileName,
  getProfileRole,
  isEmployee,
} from "@/models/profile";
import FormButton from "../FormButton";
import ConfirmDialog from "@/components/ConfirmDialog";
import { deleteCustomer, deleteEmployee } from "@/lib/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const ProfileCard = ({
  profile,
}: {
  profile: Profile;
}) => {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const getTitle = () => {
    if (isEmployee(profile)) {
      return `Delete Employee: ${getProfileName(profile)}`;
    } else {
      return `Delete Customer: ${getProfileName(profile)}`;
    }
  };

  const getDescription = () => {
    if (isEmployee(profile)) {
      return `Are you sure you want to delete the employee ${getProfileName(profile)}? The appointments associated with this employee will also be deleted. This action cannot be undone.`;
    } else {
      return `Are you sure you want to delete the customer ${getProfileName(profile)}? The appointments associated with this customer will also be deleted. This action cannot be undone.`;
    }
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    
    if (isEmployee(profile)) {
      // Handle employee deletion logic here
      const employeeId = profile._id;
      const result = await deleteEmployee(employeeId);

      if (result.status === "SUCCESS") {
        toast.success("Success", {
          description: "Employee deleted successfully.",
        });
        // Refetch data from Supabase
        router.refresh();
      } else {
        toast.error("Error", {
          description: `Failed to delete employee: ${result.error}`,
        });
      }
    } else {
      // Handle customer deletion logic here
      const customerId = profile._id;
      const result = await deleteCustomer(customerId);
      if (result.status === "SUCCESS") {
        toast.success("Success", {
          description: "Customer deleted successfully.",
        });
        // Refetch data from Supabase
        router.refresh();
      } else {
        toast.error("Error", {
          description: `Failed to delete customer: ${result.error}`,
        });
      }
    }
  };

  return (
    <>
      <li
        className="flex-between line_card cursor-pointer"
        onClick={() => {
          if (isEmployee(profile)) {
            router.push(`/employees/${profile._id}`);
          }
        }}
      >
        <div className="flex flex-col">
          <p className="text-lg font-bold">{getProfileName(profile)}</p>
          <p className="text-sm font-semibold">{getProfileRole(profile)}</p>
        </div>
        <div className="flex-between h-5 space-x-1">
          {isEmployee(profile) ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <FormButton
                mode="history"
                type="employees"
                profile={profile}
                variant="default"
                size="icon"
                className="bg-yellow-500 hover:bg-yellow-400"
              >
                <History className="size-5" aria-hidden="true" />
              </FormButton>
            </span>
          ) : (
            <>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <FormButton
                  mode="edit"
                  type="customers"
                  profile={profile}
                  variant="default"
                  size="icon"
                  className="bg-blue-500 hover:bg-blue-400"
                >
                  <Pencil className="size-5" aria-hidden="true" />
                </FormButton>
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <FormButton
                  mode="history"
                  type="customers"
                  profile={profile}
                  variant="default"
                  size="icon"
                  className="bg-yellow-500 hover:bg-yellow-400"
                >
                  <History className="size-5" aria-hidden="true" />
                </FormButton>
              </span>
            </>
          )}
          <span
            onClick={(e) => {
              // Chặn nổi bọt để không trigger onClick của <li>
              e.stopPropagation();
            }}
          >
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                setShowConfirm(true);
              }}
            >
              <Trash2 className="size-5" aria-hidden="true" />
            </Button>
          </span>
        </div>
      </li>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={getTitle()}
        description={getDescription()}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default ProfileCard;

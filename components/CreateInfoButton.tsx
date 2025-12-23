"use client";

import { useRouter } from "next/navigation";
import FormButton from "./FormButton";
import { Button } from "./ui/button";

const CreateInfoButton = ({
  type,
  onSuccess,
  categories,
}: {
  type: string;
  onSuccess?: () => void;
  categories?: { _id: string; name: string }[];
}) => {
  const router = useRouter();

  const getTitle = (type: string) => {
    switch (type) {
      case "employees":
        return "New Employee";
      case "customers":
        return "New Customer";
      case "services":
        return "New Service";
      case "schedule":
        return "New Appointment";
      default:
        return "New Item";
    }
  };

  // For employees, navigate to detail page instead of opening dialog
  if (type === "employees") {
    return (
      <Button
        onClick={() => {
          router.push("/employees/new");
          if (onSuccess) onSuccess();
        }}
      >
        {getTitle(type)}
      </Button>
    );
  }

  return (
    <FormButton
      mode="create"
      type={type as "employees" | "customers" | "services" | "schedule"}
      onSuccess={onSuccess}
      categories={type === "services" ? categories : undefined}
    >
      {getTitle(type)}
    </FormButton>
  );
};

export default CreateInfoButton;

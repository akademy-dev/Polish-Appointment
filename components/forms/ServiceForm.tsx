import React from "react";
import { Customer } from "@/types/profile";

const ServiceForm = ({
  className,
  initialData,
  onSuccess,
  hideSubmitButton = false,
  formRef,
}: {
  className?: string;
  initialData?: Customer;
  onSuccess?: () => void;
  hideSubmitButton?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
}) => {

  return <div>ServiceForm</div>;
};

export default ServiceForm;

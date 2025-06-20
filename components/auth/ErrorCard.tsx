import { CardWrapper } from "@/components/auth/CardWrapper";
import { TriangleAlert } from "lucide-react";

export const ErrorCard = () => {
  return (
    <CardWrapper backButtonHref="/auth/login" backButtonLabel="Back to login">
      <div className="w-full flex justify-center items-center">
        <TriangleAlert className="text-destructive" />
      </div>
    </CardWrapper>
  );
};

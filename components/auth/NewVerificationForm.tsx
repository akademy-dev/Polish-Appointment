"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { newVerification } from "@/actions/new-verification";
import { CardWrapper } from "@/components/auth/CardWrapper";
import { FormError } from "@/components/FormError";
import { FormSuccess } from "@/components/FormSuccess";
import { Loader } from "lucide-react";

export const NewVerificationForm = () => {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const searchParams = useSearchParams();

  // Supabase confirmation links use `code` (PKCE). Keep `token` fallback for legacy links.
  const code = searchParams.get("code") ?? searchParams.get("token");

  const onSubmit = useCallback(() => {
    if (success || error) return;

    if (!code) {
      setError("Missing code!");
      return;
    }

    newVerification(code)
      .then((data) => {
        setSuccess(data.success);
        setError(data.error);
      })
      .catch(() => {
        setError("Something went wrong!");
      });
  }, [code, success, error]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <CardWrapper backButtonLabel="Back to login" backButtonHref="/auth/login">
      <div className="flex items-center w-full justify-center">
        {!success && !error && <Loader />}
        <FormSuccess message={success} />
        {!success && <FormError message={error} />}
      </div>
    </CardWrapper>
  );
};

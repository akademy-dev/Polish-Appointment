"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { BackButton } from "@/components/auth/BackButton";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

interface CardWrapperProps {
  children: React.ReactNode;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
}

const font = Poppins({
  subsets: ["latin"],
  weight: ["600"],
});

export const CardWrapper = ({
  children,
  // backButtonLabel,
  // backButtonHref,
}: CardWrapperProps) => {
  return (
    <Card className="w-[400px] shadow-md">
      <CardHeader>
        <div className="w-full flex flex-col gap-y-4 items-center justify-center">
          <h1
            className={cn(
              "text-3xl font-semibold flex items-center gap-x-2",
              font.className,
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/nail-polish.png"
              alt="Nail Polish Icon"
              className="w-8 h-8"
            />
            The Polish Lounge
          </h1>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-screen">
      <Loader2 className="h-24 w-24 animate-spin text-primary" />
    </div>
  );
}

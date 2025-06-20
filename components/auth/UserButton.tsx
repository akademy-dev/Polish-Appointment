"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/user-current-user";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { LogOut, User } from "lucide-react";

export const UserButton = () => {
  const user = useCurrentUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {/*<Avatar>*/}
        {/*  <AvatarImage src={user?.image || ""} />*/}
        {/*  <AvatarFallback className="bg-orange-500">*/}
        {/*    <User className="text-white" />*/}
        {/*  </AvatarFallback>*/}
        {/*</Avatar>*/}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end">
        <LogoutButton>
          <DropdownMenuItem>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

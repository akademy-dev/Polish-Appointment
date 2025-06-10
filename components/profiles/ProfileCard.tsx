"use client";
import React from "react";
import { History, Pencil, Trash2 } from "lucide-react";
import {
  Profile,
  getProfileName,
  getProfileRole,
  isEmployee,
} from "@/models/profile";
import FormButton from "../FormButton";

const ProfileCard = ({ profile }: { profile: Profile }) => {
  return (
    <li className="flex-between line_card">
      <div className="flex flex-col">
        <p className="text-lg font-bold">{getProfileName(profile)}</p>
        <p className="text-sm font-semibold">{getProfileRole(profile)}</p>
      </div>
      <div className="flex-between h-5 space-x-1">
        <FormButton
          mode="edit"
          type={isEmployee(profile) ? "employees" : "customers"}
          profile={profile}
          variant="default"
          size="icon"
        >
          <Pencil className="size-5" aria-hidden="true" />
        </FormButton>
        {isEmployee(profile) && (
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
        )}
        <FormButton
          mode="delete"
          type="employees"
          profile={profile}
          variant="default"
          size="icon"
          className="bg-red-500 hover:bg-red-400"
        >
          <Trash2 className="size-5" aria-hidden="true" />
        </FormButton>
      </div>
    </li>
  );
};

export default ProfileCard;

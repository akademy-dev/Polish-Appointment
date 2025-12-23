"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";

import { unstable_update } from "@/auth";
import { SettingsSchema } from "@/form-schemas";
import { currentUser } from "@/lib/auth";
import { supabaseAdmin, supabaseAuth } from "@/lib/supabase";
import { UserRole } from "@/models/typings";

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const user = await currentUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Fetch current Supabase user (source of truth)
  const { data: current, error: currentErr } =
    await supabaseAdmin.auth.admin.getUserById(user.id!);
  if (currentErr || !current.user) {
    return { error: "Unauthorized" };
  }

  // If user logged in via OAuth, keep the old behavior (disable email/password updates)
  if (user.isOAuth) {
    values.email = undefined;
    values.password = undefined;
    values.newPassword = undefined;
  }

  // 1) Update email (Supabase will handle confirmation email if enabled in project settings)
  if (values.email && values.email !== user.email) {
    const { error: updateEmailErr } =
      await supabaseAdmin.auth.admin.updateUserById(user.id!, {
        email: values.email,
      });
    if (updateEmailErr) return { error: updateEmailErr.message };
  }

  // 2) Update password (require current password by re-authenticating)
  if (values.password && values.newPassword) {
    const currentEmail = current.user.email;
    if (!currentEmail) return { error: "Missing email" };

    const { error: reauthErr } = await supabaseAuth.auth.signInWithPassword({
      email: currentEmail,
      password: values.password,
    });
    if (reauthErr) {
      return { error: "Incorrect password!" };
    }

    const { error: updatePassErr } =
      await supabaseAdmin.auth.admin.updateUserById(user.id!, {
        password: values.newPassword,
      });
    if (updatePassErr) return { error: updatePassErr.message };
  }

  // 3) Update metadata (name/role/isTwoFactorEnabled)
  const nextMeta: Record<string, unknown> = {
    ...(current.user.user_metadata ?? {}),
  };
  if (values.name !== undefined) nextMeta.name = values.name;
  if (values.isTwoFactorEnabled !== undefined)
    nextMeta.isTwoFactorEnabled = values.isTwoFactorEnabled;
  if (values.role) nextMeta.role = values.role;

  const { data: updated, error: updateMetaErr } =
    await supabaseAdmin.auth.admin.updateUserById(user.id!, {
      user_metadata: nextMeta,
    });
  if (updateMetaErr) return { error: updateMetaErr.message };

  const updatedUser = updated.user ?? current.user;

  //unstable update in Beta version
  unstable_update({
    user: {
      name:
        (updatedUser.user_metadata?.name as string | undefined) ??
        values.name ??
        user.name,
      email: updatedUser.email ?? values.email ?? user.email,
      isTwoFactorEnabled: Boolean(
        updatedUser.user_metadata?.isTwoFactorEnabled
      ),
      role:
        (updatedUser.user_metadata?.role as UserRole | undefined) ??
        values.role ??
        user.role,
    },
  });

  revalidatePath("/settings");
  return { success: "Settings Updated!" };
};

export async function updateSMSMessage(settingId: string, smsMessage: string) {
  try {
    const { updateSettings } = await import("@/data/settings");
    const result = await updateSettings(settingId, { sms_message: smsMessage });

    if (!result) {
      return { status: "ERROR", error: "Failed to update SMS message" };
    }

    revalidatePath("/settings");

    return { status: "SUCCESS" };
  } catch (error) {
    console.error("Error updating SMS message:", error);
    return { status: "ERROR", error: "Failed to update SMS message" };
  }
}

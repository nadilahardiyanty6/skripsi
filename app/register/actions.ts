"use server";

import { requireUser } from "@/lib/auth";
import { updateProfileDetails } from "@/lib/profile";

export async function completeProfileAction(input: { fullName: string; phoneE164: string }) {
  const { userId } = await requireUser();

  const fullName = (input.fullName ?? "").trim();
  const phoneE164 = (input.phoneE164 ?? "").trim();

  // basic validation
  if (fullName.length < 2) throw new Error("Nama minimal 2 karakter");
  if (phoneE164 && !phoneE164.startsWith("+")) {
    throw new Error("Nomor WA harus format E.164, contoh: +6281234567890");
  }

  await updateProfileDetails({ userId, fullName, phoneE164 });
  return { ok: true };
}

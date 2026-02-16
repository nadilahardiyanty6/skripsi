import { cookies } from "next/headers";

const COOKIE_NAME = "pb_admin";

export async function isAdminSession() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "1";
}

export async function requireAdminSession() {
  const ok = await isAdminSession();
  if (!ok) throw new Error("FORBIDDEN");
}

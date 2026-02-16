import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieLike = {
  name: string;
  value: string;
  options?: any;
};

export async function createSupabaseServer() {
  // Next 15/16 bisa async
  const cookieStore: any = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Supabase SSR butuh getAll() → kita fallback kalau Next cookieStore gak punya getAll
        getAll() {
          if (typeof cookieStore.getAll === "function") {
            return cookieStore.getAll();
          }

          // fallback: kalau hanya ada get(name), kita ambil cookie supabase yang umum
          const names = [
            "sb-access-token",
            "sb-refresh-token",
            "supabase-auth-token",
          ];

          const found: CookieLike[] = [];
          for (const n of names) {
            const c = cookieStore.get?.(n);
            if (c?.value) found.push({ name: n, value: c.value });
          }
          return found;
        },

        // Supabase SSR pakai setAll di Next
        setAll(cookiesToSet: CookieLike[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

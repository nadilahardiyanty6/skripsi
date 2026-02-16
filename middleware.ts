import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function createSupabaseMiddleware(req: NextRequest) {
  // NOTE: Jangan set request.headers secara manual
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            // set ke response agar browser update
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return { supabase, res };
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // protect admin routes
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const { supabase } = createSupabaseMiddleware(req);
  const { data } = await supabase.auth.getUser();

  // ✅ not logged in -> go to login + bring redirect back
  if (!data.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ✅ logged in: allow, RBAC role check will be on server (layout/page)
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };

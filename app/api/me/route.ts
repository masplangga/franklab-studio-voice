import { getUserFromToken, isSupabaseAuthConfigured } from "@/lib/auth";

type ProfileRow = {
  is_active?: boolean;
};

function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  };
}

export async function GET(req: Request) {
  if (!isSupabaseAuthConfigured()) {
    return Response.json(
      { success: false, error: "Autentikasi belum dikonfigurasi." },
      { status: 503 }
    );
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return Response.json(
      { success: false, error: "Login diperlukan." },
      { status: 401 }
    );
  }

  try {
    const user = await getUserFromToken(token);
    const { url, anonKey } = getSupabaseConfig();
    const response = await fetch(
      `${url}/rest/v1/profiles?select=is_active&id=eq.${user.id}&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          error: "Status akun belum bisa diperiksa.",
        },
        { status: 503 }
      );
    }

    const profiles = (await response.json()) as ProfileRow[];

    return Response.json({
      success: true,
      user,
      isActive: profiles[0]?.is_active === true,
    });
  } catch {
    return Response.json(
      { success: false, error: "Session tidak valid." },
      { status: 401 }
    );
  }
}

import { getUserFromToken, isSupabaseAuthConfigured } from "@/lib/auth";

export type AccessCheck =
  | {
      ok: true;
      user: {
        id: string;
        email: string;
      };
      isActive: true;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

type ProfileRow = {
  is_active?: boolean;
};

function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

function getProfileHeaders(token: string) {
  const { anonKey, serviceRoleKey } = getSupabaseConfig();
  const apiKey = serviceRoleKey || anonKey;
  const authToken = serviceRoleKey || token;

  return {
    apikey: apiKey,
    Authorization: `Bearer ${authToken}`,
  };
}

export async function checkActiveUser(req: Request): Promise<AccessCheck> {
  if (!isSupabaseAuthConfigured()) {
    return {
      ok: false,
      status: 503,
      error: "Autentikasi belum dikonfigurasi.",
    };
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Login diperlukan untuk menggunakan fitur ini.",
    };
  }

  try {
    const user = await getUserFromToken(token);
    const { url } = getSupabaseConfig();
    const response = await fetch(
      `${url}/rest/v1/profiles?select=is_active&id=eq.${user.id}&limit=1`,
      {
        headers: getProfileHeaders(token),
      }
    );

    if (!response.ok) {
      return {
        ok: false,
        status: 503,
        error: "Status akun belum bisa diperiksa. Hubungi admin.",
      };
    }

    const profiles = (await response.json()) as ProfileRow[];
    const isActive = profiles[0]?.is_active === true;

    if (!isActive) {
      return {
        ok: false,
        status: 403,
        error: "Akun kamu belum aktif. Hubungi admin untuk aktivasi.",
      };
    }

    return {
      ok: true,
      user,
      isActive: true,
    };
  } catch {
    return {
      ok: false,
      status: 401,
      error: "Session tidak valid. Silakan login ulang.",
    };
  }
}

import { getUserFromToken, isSupabaseAuthConfigured } from "@/lib/auth";

type ProfileRow = {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

type UpdateRequest = {
  userId?: unknown;
  isActive?: unknown;
};

function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdmin(req: Request) {
  if (!isSupabaseAuthConfigured()) {
    return {
      ok: false as const,
      status: 503,
      error: "Autentikasi belum dikonfigurasi.",
    };
  }

  const { serviceRoleKey } = getSupabaseConfig();
  if (!serviceRoleKey) {
    return {
      ok: false as const,
      status: 503,
      error: "Service role key admin belum dikonfigurasi.",
    };
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return {
      ok: false as const,
      status: 401,
      error: "Login admin diperlukan.",
    };
  }

  try {
    const user = await getUserFromToken(token);
    const adminEmails = getAdminEmails();

    if (!adminEmails.includes(user.email.toLowerCase())) {
      return {
        ok: false as const,
        status: 403,
        error: "Akun ini bukan admin.",
      };
    }

    return {
      ok: true as const,
      user,
    };
  } catch {
    return {
      ok: false as const,
      status: 401,
      error: "Session tidak valid. Silakan login ulang.",
    };
  }
}

function adminHeaders() {
  const { serviceRoleKey } = getSupabaseConfig();

  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin.ok) {
    return Response.json(
      { success: false, error: admin.error },
      { status: admin.status }
    );
  }

  const { url } = getSupabaseConfig();
  const response = await fetch(
    `${url}/rest/v1/profiles?select=id,email,is_active,created_at&order=created_at.desc`,
    {
      headers: adminHeaders(),
    }
  );

  if (!response.ok) {
    return Response.json(
      { success: false, error: "Gagal mengambil daftar user." },
      { status: 502 }
    );
  }

  const users = (await response.json()) as ProfileRow[];

  return Response.json({
    success: true,
    users,
  });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin.ok) {
    return Response.json(
      { success: false, error: admin.error },
      { status: admin.status }
    );
  }

  const body = (await req.json().catch(() => null)) as UpdateRequest | null;
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const isActive = typeof body?.isActive === "boolean" ? body.isActive : null;

  if (!userId || isActive === null) {
    return Response.json(
      { success: false, error: "Data aktivasi tidak valid." },
      { status: 400 }
    );
  }

  const { url } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      ...adminHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify({ is_active: isActive }),
  });

  if (!response.ok) {
    return Response.json(
      { success: false, error: "Gagal mengubah status user." },
      { status: 502 }
    );
  }

  const users = (await response.json()) as ProfileRow[];

  return Response.json({
    success: true,
    user: users[0],
  });
}

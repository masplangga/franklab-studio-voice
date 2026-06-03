export const AUTH_STORAGE_KEY = "franklab-auth-session";

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user: AuthUser;
};

type SupabaseUserResponse = {
  id?: string;
  email?: string;
  user?: {
    id?: string;
    email?: string;
  };
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
};

function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  };
}

export function isSupabaseAuthConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

function getSupabaseHeaders(accessToken?: string) {
  const { anonKey } = getSupabaseConfig();

  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken || anonKey}`,
    "Content-Type": "application/json",
  };
}

function toAuthSession(data: SupabaseUserResponse): AuthSession | null {
  const user = data.user || data;
  const accessToken = data.access_token;

  if (!user?.id || !user?.email || !accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    user: {
      id: user.id,
      email: user.email,
    },
  };
}

async function readJsonResponse<T>(response: Response) {
  const data = (await response.json().catch(() => null)) as
    | (T & { error_description?: string; msg?: string; message?: string })
    | null;

  if (!response.ok) {
    throw new Error(
      data?.error_description ||
        data?.msg ||
        data?.message ||
        "Request autentikasi gagal."
    );
  }

  return data as T;
}

export async function signInWithPassword(email: string, password: string) {
  const { url } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: getSupabaseHeaders(),
    body: JSON.stringify({ email, password }),
  });

  const data = await readJsonResponse<SupabaseUserResponse>(response);
  const session = toAuthSession(data);

  if (!session) {
    throw new Error("Session login tidak ditemukan.");
  }

  return session;
}

export async function signUpWithPassword(email: string, password: string) {
  const { url } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: getSupabaseHeaders(),
    body: JSON.stringify({ email, password }),
  });

  return readJsonResponse<SupabaseUserResponse>(response);
}

export async function getUserFromToken(accessToken: string) {
  const { url } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    method: "GET",
    headers: getSupabaseHeaders(accessToken),
  });

  const data = await readJsonResponse<SupabaseUserResponse>(response);
  const user = data.user || data;

  if (!user?.id || !user?.email) {
    throw new Error("User tidak ditemukan.");
  }

  return {
    id: user.id,
    email: user.email,
  };
}

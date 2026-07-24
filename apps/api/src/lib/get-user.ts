import { headers } from "next/headers";
import { jwtVerify } from "jose";
import { auth } from "@/src/auth";

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

type AuthUser = { id: string; email: string; name: string };

export async function getUser(): Promise<AuthUser | null> {
  const headersList = await headers();
  const authorization = headersList.get("Authorization");

  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7);
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return {
        id: payload.sub as string,
        email: payload.email as string,
        name: payload.name as string,
      };
    } catch {
      return null;
    }
  }

  const session = await auth();
  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email ?? "",
      name: session.user.name ?? "",
    };
  }

  return null;
}

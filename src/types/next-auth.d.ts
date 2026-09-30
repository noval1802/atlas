import type { DefaultSession, DefaultUser } from "next-auth";
import type { AppRole } from "@/auth/roles";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      externalIdentityId?: string;
      role: AppRole;
      kodamScope: string[];
    };
  }
  interface User extends DefaultUser {
    role?: AppRole;
    kodamScope?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    externalIdentityId?: string;
    role?: AppRole;
    kodamScope?: string[];
  }
}

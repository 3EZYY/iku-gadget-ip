// Auth feature barrel export
export { useAuth } from "@/hooks/useAuth";
export { useRole } from "@/hooks/useRole";
export type { AppRole } from "@/hooks/useRole";
export { signIn, signUp, signOut, createUserWithRole } from "@/lib/auth";

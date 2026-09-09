import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentUserId } from "../../lib/auth/user";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { logout } from "./actions";
import { MobileSpaceNav } from "../components/mobile-space-nav";

export const dynamic = "force-dynamic";

export default async function SpaceLayout({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const userId = await getCurrentUserId();

  return (
    <main className="space-page">
      <nav className="space-nav">
        <Link className="brand" href="/"><span className="coffee-mark" aria-hidden="true"><span /></span><span>Beanmemo</span></Link>
        <div className="space-links">
          <Link href="/space">Overview</Link>
          <Link href="/space/beans">My Beans</Link>
          <Link href="/space/brews">Brew Journal</Link>
          <Link href="/space/taste">My Taste</Link>
          <Link href="/space/world">Coffee World</Link>
        </div>
        {configured && userId ? (
          <form action={logout}><button className="space-logout" type="submit">Sign out</button></form>
        ) : (
          <Link className="space-logout" href="/login">Sign in</Link>
        )}
      </nav>
      {children}
      {configured && userId && <MobileSpaceNav />}
    </main>
  );
}

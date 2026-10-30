import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy · The Art Walk", description: "What The Art Walk map stores, who can see it, and how to delete it." };

const WHATSAPP = process.env.NEXT_PUBLIC_SUBMIT_WHATSAPP || "919654256673";

/** Plain-language privacy notice. Linked from the sign-in screen and the profile; Google sign-in needs it too. */
export default function Privacy() {
  return (
    <main className="show-page">
      <div className="detail-body legal">
        <p><Link href="/">← Back to the map</Link></p>
        <h1>Privacy</h1>
        <p className="sub">Last updated 30 October 2026</p>

        <h2>Without an account</h2>
        <p>You can use the map, save shows and keep a visit diary without signing in. Those saves, your diary, your language and your appearance setting stay in your browser on this device. We don&apos;t receive them.</p>
        <p>If you tap &ldquo;Show my location&rdquo;, your browser shares your position with the page only to work out distances. It isn&apos;t sent to us or stored.</p>

        <h2>With an account</h2>
        <p>Signing in with Google lets you add friends, leave notes on shows and say you&apos;re going to an opening. When you sign in we store:</p>
        <ul>
          <li>Your name, profile photo and email address from Google, and the username you pick.</li>
          <li>Your friend requests and friendships.</li>
          <li>Notes you write on shows, and the openings you mark as going.</li>
        </ul>
        <p>Signed-in people can find you by your name or username, so they can send you a friend request. Your notes and the openings you&apos;re going to are visible only to you and friends whose request you accepted (or who accepted yours). We don&apos;t show who your friends are to anyone else. We don&apos;t sell your data or use it for advertising.</p>
        <p>Accounts are for people aged 18 and over.</p>

        <h2>Where it&apos;s kept</h2>
        <p>Account data is stored with Supabase, our database provider. The site is hosted by Vercel. Map tiles come from OpenFreeMap, which sees the map area your browser loads, as any map service does.</p>

        <h2>Deleting your data</h2>
        <p>Open your profile and tap <b>Delete my account</b>. This permanently removes your account, friendships, notes and going marks straight away. To clear saves and your diary on a device, use <b>Clear saved shows and diary</b> in your profile.</p>

        <h2>Contact</h2>
        <p>Questions or requests: message The Art Walk on <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">WhatsApp</a> or <a href="https://www.instagram.com/theartwalk.in/" target="_blank" rel="noopener noreferrer">Instagram (@theartwalk.in)</a>.</p>
      </div>
    </main>
  );
}

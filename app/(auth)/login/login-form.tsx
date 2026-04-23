"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(`Magic link sent to ${email}. Check your inbox.`);
  }

  return (
    <div className="bg-white shadow rounded-lg p-8 space-y-5">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl text-neutral-900">Sign in</h1>
        <p className="text-xs text-neutral-500">
          We&apos;ll email you a secure link. No password needed.
        </p>
      </div>

      <form onSubmit={handleMagicLink} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send magic link"}
        </Button>
      </form>
    </div>
  );
}

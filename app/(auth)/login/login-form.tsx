"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const RESEND_COOLDOWN_SECONDS = 30;

type Step = "email" | "code";

export default function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function sendCode(targetEmail: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: { shouldCreateUser: false },
    });
    if (error) throw error;
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendCode(email);
      setStep("code");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCodeSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError(null);
    try {
      await sendCode(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code.");
    }
  }

  if (step === "email") {
    return (
      <form onSubmit={handleEmailSubmit} className="w-full">
        <div className="mb-5">
          <h1 className="text-3xl font-medium text-neutral-900">
            Welcome to KWILL
          </h1>
        </div>
        <div className="grid gap-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            placeholder="Email address (required)"
            className="h-14 w-full rounded-md border border-[#CDCEC8] bg-transparent px-4 text-base text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-600"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="mt-4">
          <Button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-md text-base"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleCodeSubmit} className="w-full">
      <div className="mb-5 text-center">
        <h2 className="mb-2 text-3xl font-medium text-neutral-900">
          Check your email
        </h2>
        <p className="text-sm text-neutral-500">
          Enter the verification code sent to
        </p>
        <p className="text-sm text-neutral-700">{email}</p>
      </div>

      <div className="mb-8 grid gap-y-2">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(v) => {
              setCode(v);
              if (v.length === 6) handleCodeSubmit();
            }}
            autoFocus
            disabled={loading}
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="h-14 w-14 border-[#CDCEC8] text-base first:rounded-l-md last:rounded-r-md data-[active=true]:border-neutral-600 data-[active=true]:ring-2 data-[active=true]:ring-neutral-600"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-center">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={handleResend}
            disabled={cooldown > 0}
          >
            {cooldown > 0
              ? `Didn't receive a code? Resend (${cooldown})`
              : "Didn't receive a code? Resend"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          type="submit"
          disabled={loading || code.length !== 6}
          className="h-14 w-full rounded-md text-base"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Continue"
          )}
        </Button>
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setCode("");
            setError(null);
          }}
          className="block w-full text-center text-sm text-neutral-500 hover:text-neutral-700"
        >
          Use a different email
        </button>
      </div>
    </form>
  );
}

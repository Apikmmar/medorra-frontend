"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cognitoService } from "@/lib/auth";

function ConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await cognitoService.confirmSignUp(email, code);
      router.push("/auth/login?confirmed=true");
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setResending(true);
    setResendSuccess(false);
    setError("");

    try {
      await cognitoService.resendConfirmationCode(email);
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-accent-text">Medorra</h1>
          <p className="mt-2 text-muted">Verify your email address</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-2xl border border-border bg-surface p-8 shadow-card">
          <p className="text-sm text-muted">
            We sent a verification code to your email. Enter it below to confirm your account.
          </p>

          {error && (
            <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">
              {error}
            </div>
          )}

          {resendSuccess && (
            <div className="rounded-lg bg-success/10 p-3 text-sm text-success" role="status">
              Verification code resent. Check your email.
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input mt-1"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="code" className="label">
                Verification code
              </label>
              <input
                id="code"
                type="text"
                required
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="input mt-1 text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="btn-primary w-full"
          >
            {loading ? "Verifying..." : "Verify account"}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-medium text-accent-text hover:brightness-110 disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend code"}
            </button>

            <Link href="/auth/login" className="font-medium text-muted hover:text-fg">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmForm />
    </Suspense>
  );
}

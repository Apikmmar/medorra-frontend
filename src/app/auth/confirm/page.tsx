"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cognitoService } from "@/lib/auth";

export default function ConfirmPage() {
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-700">Medorra</h1>
          <p className="mt-2 text-gray-600">Verify your email address</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-lg bg-white p-8 shadow">
          <p className="text-sm text-gray-600">
            We sent a verification code to your email. Enter it below to confirm your account.
          </p>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          {resendSuccess && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700" role="status">
              Verification code resent. Check your email.
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-2xl font-mono tracking-widest text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="000000"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify account"}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend code"}
            </button>

            <Link href="/auth/login" className="font-medium text-gray-500 hover:text-gray-700">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

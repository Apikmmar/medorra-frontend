"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "@/components/auth";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.replace("/");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-700">Medorra</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-lg bg-white p-8 shadow">
          {confirmed && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700" role="status">
              Email verified! You can now sign in.
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
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
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <PasswordInput
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              disableCopyPaste
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

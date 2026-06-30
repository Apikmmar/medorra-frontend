/**
 * Application configuration loaded from environment variables.
 */
export const config = {
  api: {
    url: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  },
  cognito: {
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
    region: process.env.NEXT_PUBLIC_COGNITO_REGION || "us-east-1",
  },
  session: {
    /** Inactivity timeout in milliseconds (15 minutes) */
    inactivityTimeoutMs: 15 * 60 * 1000,
  },
} as const;

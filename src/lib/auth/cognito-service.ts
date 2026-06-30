/**
 * Cognito authentication service.
 *
 * Wraps amazon-cognito-identity-js to provide login, register, logout,
 * and token refresh functionality against the configured Cognito User Pool.
 */

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from "amazon-cognito-identity-js";
import { config } from "../config";
import { AuthTokens, AuthUser, LoginCredentials, RegisterCredentials } from "./types";

function getUserPool(): CognitoUserPool {
  return new CognitoUserPool({
    UserPoolId: config.cognito.userPoolId,
    ClientId: config.cognito.clientId,
  });
}

function extractTokens(session: CognitoUserSession): AuthTokens {
  return {
    accessToken: session.getAccessToken().getJwtToken(),
    idToken: session.getIdToken().getJwtToken(),
    refreshToken: session.getRefreshToken().getToken(),
  };
}

function extractUser(session: CognitoUserSession): AuthUser {
  const idTokenPayload = session.getIdToken().decodePayload();
  return {
    userId: idTokenPayload.sub as string,
    email: idTokenPayload.email as string,
  };
}

export const cognitoService = {
  /**
   * Authenticate a user with email and password.
   */
  login(credentials: LoginCredentials): Promise<{ tokens: AuthTokens; user: AuthUser }> {
    return new Promise((resolve, reject) => {
      const userPool = getUserPool();
      const cognitoUser = new CognitoUser({
        Username: credentials.email,
        Pool: userPool,
      });

      const authDetails = new AuthenticationDetails({
        Username: credentials.email,
        Password: credentials.password,
      });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => {
          resolve({
            tokens: extractTokens(session),
            user: extractUser(session),
          });
        },
        onFailure: (err) => {
          reject(mapCognitoError(err));
        },
      });
    });
  },

  /**
   * Register a new user account.
   */
  register(credentials: RegisterCredentials): Promise<void> {
    return new Promise((resolve, reject) => {
      const userPool = getUserPool();

      const attributes: CognitoUserAttribute[] = [
        new CognitoUserAttribute({ Name: "email", Value: credentials.email }),
      ];

      if (credentials.timezone) {
        attributes.push(
          new CognitoUserAttribute({
            Name: "custom:timezone",
            Value: credentials.timezone,
          })
        );
      }

      userPool.signUp(
        credentials.email,
        credentials.password,
        attributes,
        [],
        (err) => {
          if (err) {
            reject(mapCognitoError(err));
            return;
          }
          resolve();
        }
      );
    });
  },

  /**
   * Refresh the current session using the stored refresh token.
   * Returns new tokens or null if refresh fails.
   */
  refreshSession(refreshTokenValue: string, email: string): Promise<AuthTokens | null> {
    return new Promise((resolve) => {
      const userPool = getUserPool();
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      const { CognitoRefreshToken } = require("amazon-cognito-identity-js");
      const refreshToken = new CognitoRefreshToken({ RefreshToken: refreshTokenValue });

      cognitoUser.refreshSession(refreshToken, (err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          resolve(null);
          return;
        }
        resolve(extractTokens(session));
      });
    });
  },

  /**
   * Sign out the current user (local sign-out).
   */
  logout(email?: string): void {
    if (!email) return;
    const userPool = getUserPool();
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });
    cognitoUser.signOut();
  },

  /**
   * Confirm a user's email with the verification code.
   */
  confirmSignUp(email: string, code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const userPool = getUserPool();
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) {
          reject(mapCognitoError(err));
          return;
        }
        resolve();
      });
    });
  },

  /**
   * Resend the verification code to the user's email.
   */
  resendConfirmationCode(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const userPool = getUserPool();
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.resendConfirmationCode((err) => {
        if (err) {
          reject(mapCognitoError(err));
          return;
        }
        resolve();
      });
    });
  },
};

/**
 * Map Cognito error codes to user-friendly error messages.
 * Maintains error opacity for security (Requirement 1.3).
 */
function mapCognitoError(err: any): Error {
  const code = err?.code || err?.name || "";

  switch (code) {
    case "NotAuthorizedException":
      // Opaque error - don't reveal which credential was wrong
      return new AuthError("Invalid email or password", "AUTH_ERROR");
    case "UserNotFoundException":
      // Same message as wrong password for security
      return new AuthError("Invalid email or password", "AUTH_ERROR");
    case "UsernameExistsException":
      return new AuthError("An account with this email already exists", "EMAIL_EXISTS");
    case "InvalidPasswordException":
      return new AuthError(
        "Password must be 8-128 characters with at least one uppercase, one lowercase, and one digit",
        "INVALID_PASSWORD"
      );
    case "LimitExceededException":
      return new AuthError(
        "Account temporarily locked. Try again in 15 minutes",
        "ACCOUNT_LOCKED"
      );
    case "TooManyRequestsException":
      return new AuthError(
        "Too many requests. Please try again later",
        "RATE_LIMITED"
      );
    default:
      return new AuthError("An unexpected error occurred. Please try again.", "UNKNOWN_ERROR");
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

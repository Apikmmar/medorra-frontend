/**
 * Web push helpers: service-worker registration, subscription lifecycle,
 * and syncing the subscription with the backend.
 */

import { apiClient } from "@/lib/api/client";
import { config } from "@/lib/config";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

/**
 * Requests permission, subscribes this device to push, and registers the
 * subscription with the backend. Throws with a user-friendly message on failure.
 */
export async function subscribeToPush(): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error("Push notifications aren't supported on this device.");
  }
  if (!config.push.vapidPublicKey) {
    throw new Error("Push notifications are not configured.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was denied.");
  }

  const registration = await getRegistration();
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.push.vapidPublicKey) as BufferSource,
    });
  }

  await apiClient.post("/settings/push-subscription", {
    subscription: subscription.toJSON(),
  });

  return subscription;
}

/** Removes the subscription from the backend and unsubscribes this device. */
export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await getExistingSubscription();
  if (!subscription) return;

  await apiClient.delete("/settings/push-subscription", {
    subscription: subscription.toJSON(),
  });

  await subscription.unsubscribe();
}

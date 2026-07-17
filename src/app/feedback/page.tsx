"use client";

import { FeedbackForm } from "@/components/feedback";
import { Card, toast } from "@/components/ui";

export default function FeedbackPage() {
  function handleSuccess() {
    toast.success("Thanks for your feedback!");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-fg">Feedback</h1>
      <p className="mt-1 text-sm text-muted">
        Report a bug, request a feature, or let us know how we&apos;re doing.
      </p>

      <Card className="mt-6 p-5 sm:p-6 animate-fade-in">
        <FeedbackForm onSuccess={handleSuccess} />
      </Card>
    </div>
  );
}

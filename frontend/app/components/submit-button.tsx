"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel: string;
};

export function SubmitButton({ children, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className="auth-submit" type="submit" disabled={pending} aria-disabled={pending}>
      <span>{pending ? pendingLabel : children}</span>
      <span aria-hidden="true">↗</span>
    </button>
  );
}

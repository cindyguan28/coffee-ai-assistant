export type CredentialValidation =
  | { ok: true; email: string; password: string }
  | { ok: false; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(emailValue: FormDataEntryValue | null) {
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  return EMAIL_PATTERN.test(email)
    ? { ok: true as const, email }
    : { ok: false as const, message: "Enter a valid email address." };
}

export function safeRedirectPath(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string") return "/space";
  if (!value.startsWith("/") || value.startsWith("//")) return "/space";

  try {
    const parsed = new URL(value, "https://mylot.local");
    if (parsed.origin !== "https://mylot.local") return "/space";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/space";
  }
}

export function validateCredentials(
  emailValue: FormDataEntryValue | null,
  passwordValue: FormDataEntryValue | null,
): CredentialValidation {
  const emailResult = validateEmail(emailValue);
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!emailResult.ok) return emailResult;
  if (password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }

  return { ok: true, email: emailResult.email, password };
}

export function validateNewPassword(
  passwordValue: FormDataEntryValue | null,
  confirmationValue: FormDataEntryValue | null,
) {
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const confirmation = typeof confirmationValue === "string" ? confirmationValue : "";

  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      ok: false as const,
      message: "Use at least 8 characters, including a letter and a number.",
    };
  }
  if (password !== confirmation) {
    return { ok: false as const, message: "The passwords do not match." };
  }

  return { ok: true as const, password };
}

export function authMessageUrl(
  pathname: string,
  kind: "error" | "message",
  message: string,
  extra?: Record<string, string>,
) {
  const params = new URLSearchParams({ [kind]: message, ...extra });
  return `${pathname}?${params.toString()}`;
}

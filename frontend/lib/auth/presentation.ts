export type LoginPresentation = {
  heading: string;
  subtitle: string;
  statusMessage: string | null;
};

export function loginPresentation(mode?: string, status?: string): LoginPresentation {
  if (mode === "signup") {
    return {
      heading: "Create your space",
      subtitle: "Create a private home for your beans, brews and evolving taste.",
      statusMessage: null,
    };
  }

  if (status === "signed-out") {
    return {
      heading: "Signed out safely",
      subtitle: "Sign in whenever you're ready to return.",
      statusMessage: "Your session has ended on this device.",
    };
  }

  return {
    heading: "Welcome back",
    subtitle: "Return to your beans, brews and evolving taste.",
    statusMessage: null,
  };
}

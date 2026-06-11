/**
 * Ask the browser password manager (Chrome, Safari, etc.) to offer saving
 * credentials after a successful sign-up. No-op when unsupported or declined.
 */
export async function promptSaveLoginCredentials(
  email: string,
  password: string,
): Promise<void> {
  if (typeof window === "undefined" || !email.trim() || !password) return;

  try {
    const PasswordCredentialCtor = (
      window as Window & {
        PasswordCredential?: new (init: {
          id: string;
          password: string;
          name?: string;
        }) => Credential;
      }
    ).PasswordCredential;

    if (!PasswordCredentialCtor || !navigator.credentials?.store) return;

    const credential = new PasswordCredentialCtor({
      id: email.trim().toLowerCase(),
      password,
      name: email.trim(),
    });
    await navigator.credentials.store(credential);
  } catch {
    /* User declined or browser blocked the prompt */
  }
}

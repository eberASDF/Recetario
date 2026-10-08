export async function emailVerifiedAfterReload<T extends { emailVerified: boolean }>(
  user: T,
  reloadUser: (user: T) => Promise<void>,
): Promise<boolean> {
  await reloadUser(user);
  return user.emailVerified === true;
}

export async function sendVerificationThenSignOut<T>(
  user: T,
  send: (user: T) => Promise<void>,
  signOutUser: () => Promise<void>,
): Promise<boolean> {
  let sent = false;
  try {
    await send(user);
    sent = true;
  } catch {
    // The account exists; show the verification screen with a retry option.
  } finally {
    await signOutUser();
  }
  return sent;
}

export async function verifySignIn<T extends { emailVerified: boolean }>(
  user: T,
  reloadUser: (user: T) => Promise<void>,
  signOutUser: () => Promise<void>,
): Promise<boolean> {
  try {
    const verified = await emailVerifiedAfterReload(user, reloadUser);
    if (!verified) await signOutUser();
    return verified;
  } catch (error) {
    await signOutUser().catch(() => undefined);
    throw error;
  }
}

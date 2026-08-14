import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient();

export function spotifySignIn() {
	return authClient.signIn.social({ provider: "spotify", callbackURL: "/" });
}

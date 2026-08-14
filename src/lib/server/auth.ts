import {
	ORIGIN,
	BETTER_AUTH_SECRET,
	SPOTIFY_CLIENT_ID,
	SPOTIFY_CLIENT_SECRET,
} from "$app/env/private";
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { db } from "#lib/server/db/index.js";

export const auth = betterAuth({
	baseURL: ORIGIN,
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: "pg" }),
	socialProviders: {
		spotify: {
			clientId: SPOTIFY_CLIENT_ID,
			clientSecret: SPOTIFY_CLIENT_SECRET,
			scopes: ["playlist-modify-public", "playlist-modify-private"],
		},
	},
	plugins: [
		sveltekitCookies(getRequestEvent), // make sure this is the last plugin in the array
	],
});

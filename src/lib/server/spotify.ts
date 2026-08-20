import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from "$app/env/private";

export const spotify = SpotifyApi.withClientCredentials(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, [
	"playlist-modify-public",
	"playlist-modify-private",
]);

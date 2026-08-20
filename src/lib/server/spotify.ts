import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from "$app/env/private";

export const spotify = SpotifyApi.withClientCredentials(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, [
	"playlist-modify-public",
	"playlist-modify-private",
]);

export async function getAlbumTracks(ids: string[], groups: Record<string, string> = {}) {
	const tracks = [];

	for (let i = 0; i < ids.length; i += 20) {
		const chunk = ids.slice(i, i + 20);
		const albums = await spotify.albums.get(chunk, "US");

		for (const album of albums) {
			const artworkUrl = album.images.at(-1)?.url ?? null;
			const items = album.tracks.items;

			let offset = album.tracks.offset + items.length;

			while (items.length < album.tracks.total) {
				const page = await spotify.albums.tracks(album.id, "US", 50, offset);
				if (page.items.length === 0) break;

				items.push(...page.items);
				offset += page.items.length;
			}

			for (const track of items) {
				tracks.push({
					trackId: track.id,
					uri: track.uri,
					name: track.name,
					albumId: album.id,
					albumName: album.name,
					albumGroup: groups[album.id] ?? album.album_type,
					albumReleaseDate: album.release_date,
					artworkUrl,
					durationMs: track.duration_ms,
					trackNumber: track.track_number,
					discNumber: track.disc_number,
				});
			}
		}
	}

	return tracks;
}

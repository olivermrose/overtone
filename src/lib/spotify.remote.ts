import { getRequestEvent, query } from "$app/server";
import * as v from "valibot";
import { spotify } from "./server/spotify";

export type Artist = (ReturnType<Awaited<typeof searchArtists>>["current"] & {})[number];

export const getUser = query(() => {
	const event = getRequestEvent();

	if (!event.locals.user) {
		return null;
	}

	return {
		id: event.locals.user.id,
		name: event.locals.user.name,
		image: event.locals.user.image,
	};
});

export const searchArtists = query(v.pipe(v.string(), v.trim()), async (q) => {
	const data = await spotify.search(q, ["artist"], "US", 8);

	return data.artists.items.map((artist) => ({
		id: artist.id,
		name: artist.name,
		image: artist.images.at(-1)?.url ?? null,
	}));
});

export interface Album {
	id: string;
	name: string;
	group: string;
	releaseDate: string;
	artworkUrl: string | null;
	trackCount: number;
}

export const getAlbums = query(v.string(), async (artistId) => {
	const albums = [];
	let next: string | null = null;

	do {
		const response = await spotify.artists.albums(artistId, "album,single", "US", 50);

		for (const album of response.items) {
			albums.push({
				id: album.id,
				name: album.name,
				group: album.album_type,
				releaseDate: album.release_date,
				artworkUrl: album.images.at(-1)?.url ?? null,
				trackCount: album.total_tracks,
			});
		}

		next = response.next;
	} while (next);

	return albums.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
});

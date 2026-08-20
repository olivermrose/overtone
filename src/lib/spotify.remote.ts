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

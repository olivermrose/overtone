import { getRequestEvent, query } from "$app/server";
import * as v from "valibot";
import { auth } from "./server/auth";

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

const searchSchema = v.object({
	artists: v.object({
		items: v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				images: v.array(
					v.object({
						url: v.string(),
						width: v.number(),
						height: v.number(),
					}),
				),
			}),
		),
	}),
});

export const searchArtists = query(v.pipe(v.string(), v.trim()), async (q) => {
	const event = getRequestEvent();

	const result = await auth.api.getAccessToken({
		headers: event.request.headers,
		body: {
			providerId: "spotify",
		},
	});

	const response = await event.fetch(
		`https://api.spotify.com/v1/search?type=artist&limit=8&q=${encodeURIComponent(q)}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${result.accessToken}`,
				"Content-Type": "application/json",
			},
		},
	);

	const data = v.parse(searchSchema, await response.json());

	return data.artists.items.map((artist) => ({
		id: artist.id,
		name: artist.name,
		image: artist.images.at(-1)?.url ?? null,
	}));
});

import { command, getRequestEvent, query } from "$app/server";
import { error } from "@sveltejs/kit";
import * as v from "valibot";
import { nanoid } from "nanoid";
import { db } from "./server/db";
import { tierList, tierListTrack } from "./server/db/schema";
import { asc, desc, eq, inArray } from "drizzle-orm";

export type List = (ReturnType<Awaited<typeof getList>>["current"] & {})["list"];

export const getList = query(v.string(), async (slug) => {
	const event = getRequestEvent();

	if (!event.locals.user) {
		error(401, "User not authenticated");
	}

	const [list] = await db.select().from(tierList).where(eq(tierList.slug, slug)).limit(1);

	if (!list) {
		error(404, "Tier list not found");
	}

	const tracks = await db
		.select()
		.from(tierListTrack)
		.where(eq(tierListTrack.listId, list.id))
		.orderBy(asc(tierListTrack.position));

	return { list, tracks };
});

export const getUserLists = query(async () => {
	const event = getRequestEvent();

	if (!event.locals.user) {
		error(401, "User not authenticated");
	}

	const rows = await db
		.select()
		.from(tierList)
		.where(eq(tierList.userId, event.locals.user.id))
		.orderBy(desc(tierList.updatedAt));

	const trackCounts = new Map<string, number>();

	if (rows.length > 0) {
		const tracks = await db
			.select({ listId: tierListTrack.listId })
			.from(tierListTrack)
			.where(
				inArray(
					tierListTrack.listId,
					rows.map((r) => r.id),
				),
			);

		for (const track of tracks) {
			trackCounts.set(track.listId, trackCounts.getOrInsert(track.listId, 0) + 1);
		}
	}

	return rows.map((row) => ({
		...row,
		trackCount: trackCounts.get(row.id) ?? 0,
	}));
});

export const createList = command(
	v.object({
		artistId: v.string(),
		artistName: v.string(),
		artistImage: v.nullable(v.string()),
	}),
	async (data) => {
		const event = getRequestEvent();

		if (!event.locals.user) {
			error(401, "User not authenticated");
		}

		const [{ slug }] = await db
			.insert(tierList)
			.values({
				slug: nanoid(16),
				userId: event.locals.user.id,
				...data,
			})
			.returning({ slug: tierList.slug });

		return { slug };
	},
);

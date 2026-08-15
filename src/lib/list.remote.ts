import { command, getRequestEvent, query } from "$app/server";
import { error } from "@sveltejs/kit";
import * as v from "valibot";
import { nanoid } from "nanoid";
import { db } from "./server/db";
import { tierList, tierListTrack } from "./server/db/schema";
import { asc, eq } from "drizzle-orm";

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

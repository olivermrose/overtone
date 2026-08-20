import { command, getRequestEvent, query } from "$app/server";
import { error } from "@sveltejs/kit";
import * as v from "valibot";
import { nanoid } from "nanoid";
import { db } from "./server/db";
import { tierList, tierListTrack } from "./server/db/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getAlbumTracks } from "./server/spotify";
import { GROUPS } from "#lib";

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

export const saveList = command(
	v.object({
		slug: v.string(),
		groups: v.record(v.string(), v.array(v.string())),
	}),
	async (data) => {
		const [list] = await db
			.select()
			.from(tierList)
			.where(eq(tierList.slug, data.slug))
			.limit(1);

		if (!list) {
			error(404, "Tier list not found");
		}

		const owned = await db
			.select({ id: tierListTrack.id })
			.from(tierListTrack)
			.where(eq(tierListTrack.listId, list.id));

		const ownedIds = new Set(owned.map((row) => row.id));
		const updates: { id: string; tier: string; position: number }[] = [];

		for (const group of GROUPS) {
			const ids = data.groups[group] ?? [];

			for (const [index, id] of ids.entries()) {
				if (ownedIds.has(id)) {
					updates.push({ id, tier: group, position: index });
				}
			}
		}

		if (updates.length) {
			const values = sql.join(
				updates.map(
					(update) => sql`(${update.id}::uuid, ${update.tier}, ${update.position}::int)`,
				),
				sql`, `,
			);

			await db.execute(sql`
				UPDATE ${tierListTrack} AS t
				SET
					tier = v.tier,
					"position" = v."position"
				FROM
					(VALUES ${values})
				AS
					v (id, tier, "position")
				WHERE
					t.id = v.id AND
					t.list_id = ${list.id}::uuid
			`);
		}

		await db.update(tierList).set({ updatedAt: new Date() }).where(eq(tierList.id, list.id));

		return updates.length;
	},
);

export const addTracks = command(
	v.object({ slug: v.string(), ids: v.array(v.string()) }),
	async (data) => {
		const [list] = await db
			.select()
			.from(tierList)
			.where(eq(tierList.slug, data.slug))
			.limit(1);

		if (!list) {
			error(404, "Tier list not found");
		}

		const trackOrder = new Map(data.ids.map((id, i) => [id, i]));
		const tracks = await getAlbumTracks(data.ids);

		tracks.sort(
			(a, b) =>
				(trackOrder.get(a.albumId) ?? 0) - (trackOrder.get(b.albumId) ?? 0) ||
				a.discNumber - b.discNumber ||
				a.trackNumber - b.trackNumber,
		);

		const existing = await db
			.select({ name: tierListTrack.name, position: tierListTrack.position })
			.from(tierListTrack)
			.where(eq(tierListTrack.listId, list.id));

		const known = new Set(existing.map((e) => e.name));
		let position = existing.reduce((max, row) => Math.max(max, row.position), -1) + 1;

		const rows = tracks
			.filter((t) => !known.has(t.name))
			.map((t) => ({
				tier: "pool",
				listId: list.id,
				trackId: t.trackId,
				uri: t.uri,
				name: t.name,
				normalizedName: t.name,
				albumId: t.albumId,
				albumName: t.albumName,
				albumReleaseDate: t.albumReleaseDate,
				artworkUrl: t.artworkUrl,
				durationMs: t.durationMs,
				position: position++,
			}));

		if (rows.length > 0) {
			await db.insert(tierListTrack).values(rows);

			await db
				.update(tierList)
				.set({ updatedAt: new Date() })
				.where(eq(tierList.id, list.id));
		}

		await getList(data.slug).refresh();

		return rows.length;
	},
);

export const removeTrack = command(
	v.object({ slug: v.string(), trackId: v.string() }),
	async (data) => {
		const [list] = await db
			.select()
			.from(tierList)
			.where(eq(tierList.slug, data.slug))
			.limit(1);

		if (!list) {
			error(404, "Tier list not found");
		}

		await db
			.delete(tierListTrack)
			.where(and(eq(tierListTrack.listId, list.id), eq(tierListTrack.id, data.trackId)));

		await db.update(tierList).set({ updatedAt: new Date() }).where(eq(tierList.id, list.id));

		await getList(data.slug).refresh();
	},
);

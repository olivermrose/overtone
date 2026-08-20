import { command, getRequestEvent, query } from "$app/server";
import { error } from "@sveltejs/kit";
import * as v from "valibot";
import { nanoid } from "nanoid";
import { db } from "./server/db";
import { tierList, tierListTrack } from "./server/db/schema";
import { and, asc, desc, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import { getAlbumTracks } from "./server/spotify";
import { GROUPS } from "#lib";

export type List = (ReturnType<Awaited<typeof getList>>["current"] & {})["list"];

const uuid = v.pipe(v.string(), v.uuid());

function requireUser() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		error(401, "User not authenticated");
	}

	return locals.user;
}

function ownedList(slug: string, userId: string) {
	return db
		.select({ id: tierList.id })
		.from(tierList)
		.where(and(eq(tierList.slug, slug), eq(tierList.userId, userId)));
}

function touch(listId: string) {
	return db.update(tierList).set({ updatedAt: new Date() }).where(eq(tierList.id, listId));
}

export const getList = query(v.string(), async (slug) => {
	requireUser();

	// The track query resolves the slug itself rather than waiting on the list
	// query's id, so both go out at once
	const [[list], tracks] = await Promise.all([
		db.select().from(tierList).where(eq(tierList.slug, slug)).limit(1),
		db
			.select()
			.from(tierListTrack)
			.where(
				inArray(
					tierListTrack.listId,
					db.select({ id: tierList.id }).from(tierList).where(eq(tierList.slug, slug)),
				),
			)
			.orderBy(asc(tierListTrack.position)),
	]);

	if (!list) {
		error(404, "Tier list not found");
	}

	return { list, tracks };
});

export const getUserLists = query(async () => {
	const user = requireUser();

	// Counted in the database with a correlated subquery instead of fetching every
	// track row of every list and counting them in memory
	return await db
		.select({
			...getTableColumns(tierList),
			trackCount: db.$count(tierListTrack, eq(tierListTrack.listId, tierList.id)),
		})
		.from(tierList)
		.where(eq(tierList.userId, user.id))
		.orderBy(desc(tierList.updatedAt));
});

export const createList = command(
	v.object({
		artistId: v.string(),
		artistName: v.string(),
		artistImage: v.nullable(v.string()),
	}),
	async (data) => {
		const user = requireUser();

		const [{ slug }] = await db
			.insert(tierList)
			.values({
				slug: nanoid(16),
				userId: user.id,
				...data,
			})
			.returning({ slug: tierList.slug });

		return { slug };
	},
);

interface Update {
	id: string;
	tier: string;
	position: number;
}

export const saveList = command(
	v.object({
		slug: v.string(),
		groups: v.record(v.string(), v.array(uuid)),
	}),
	async (data) => {
		const user = requireUser();
		const updates: Update[] = [];

		for (const group of GROUPS) {
			for (const [index, id] of (data.groups[group] ?? []).entries()) {
				updates.push({ id, tier: group, position: index });
			}
		}

		if (!updates.length) {
			const [touched] = await db
				.update(tierList)
				.set({ updatedAt: new Date() })
				.where(and(eq(tierList.slug, data.slug), eq(tierList.userId, user.id)))
				.returning({ id: tierList.id });

			if (!touched) {
				error(404, "Tier list not found");
			}

			return 0;
		}

		const values = sql.join(
			updates.map(
				(update) =>
					sql`(${update.id}::uuid, ${update.tier}::text, ${update.position}::int)`,
			),
			sql`, `,
		);

		// Resolves the list, repositions its tracks, and bumps `updated_at`.
		const [result] = await db.execute<{ list_found: number; updated: number }>(sql`
			WITH list AS (
				SELECT ${tierList.id} AS id
				FROM ${tierList}
				WHERE
					${tierList.slug} = ${data.slug} AND
					${tierList.userId} = ${user.id}
			),
			repositioned AS (
				UPDATE ${tierListTrack} AS t
				SET
					tier = v.tier,
					"position" = v."position"
				FROM
					(VALUES ${values}) AS v (id, tier, "position"),
					list
				WHERE
					t.id = v.id AND
					t.list_id = list.id AND
					(t.tier, t."position") IS DISTINCT FROM (v.tier, v."position")
				RETURNING t.id
			),
			touched AS (
				UPDATE ${tierList}
				SET updated_at = now()
				WHERE ${tierList.id} = (SELECT id FROM list)
				RETURNING ${tierList.id}
			)
			SELECT
				(SELECT count(*)::int FROM touched) AS list_found,
				(SELECT count(*)::int FROM repositioned) AS updated
		`);

		if (!result?.list_found) {
			error(404, "Tier list not found");
		}

		return result.updated;
	},
);

export const addTracks = command(
	v.object({ slug: v.string(), ids: v.array(v.string()) }),
	async (data) => {
		const user = requireUser();

		// List id and next free position in a single round trip.
		const [list] = await db
			.select({
				id: tierList.id,
				nextPosition: sql<number>`coalesce((
					SELECT max(t."position") FROM ${tierListTrack} t WHERE t.list_id = ${tierList}.id
				), -1) + 1`.mapWith(Number),
			})
			.from(tierList)
			.where(and(eq(tierList.slug, data.slug), eq(tierList.userId, user.id)))
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

		// The same track name can arrive twice in one batch; keep the first,
		// since the unique index rejects the rest.
		const seen = new Set<string>();
		let position = list.nextPosition;

		const rows = tracks
			.filter((t) => {
				if (seen.has(t.name)) return false;
				seen.add(t.name);

				return true;
			})
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

		if (!rows.length) {
			return 0;
		}

		const inserted = await db
			.insert(tierListTrack)
			.values(rows)
			.onConflictDoNothing({
				target: [tierListTrack.listId, tierListTrack.normalizedName],
			})
			.returning({ id: tierListTrack.id });

		if (inserted.length) {
			await touch(list.id);
			await getList(data.slug).refresh();
		}

		return inserted.length;
	},
);

export const removeTrack = command(v.object({ slug: v.string(), trackId: uuid }), async (data) => {
	const user = requireUser();

	const [removed] = await db
		.delete(tierListTrack)
		.where(
			and(
				eq(tierListTrack.id, data.trackId),
				inArray(tierListTrack.listId, ownedList(data.slug, user.id)),
			),
		)
		.returning({ listId: tierListTrack.listId });

	if (removed) {
		await touch(removed.listId);
		await getList(data.slug).refresh();
	}

	return removed ? 1 : 0;
});

import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

export * from "./auth.schema";

export const tierList = pgTable(
	"tier_list",
	{
		id: uuid()
			.primaryKey()
			.default(sql`uuidv7()`),
		slug: text().notNull().unique(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		artistId: text("artist_id").notNull(),
		artistName: text("artist_name").notNull(),
		artistImage: text("artist_image"),
		title: text(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [index("tier_list_user_idx").on(t.userId, t.updatedAt.desc())],
);

export const tierListTrack = pgTable(
	"tier_list_track",
	{
		id: uuid()
			.primaryKey()
			.default(sql`uuidv7()`),
		listId: uuid("list_id")
			.notNull()
			.references(() => tierList.id, { onDelete: "cascade" }),
		trackId: text("track_id").notNull(),
		uri: text("uri").notNull(),
		name: text("name").notNull(),
		normalizedName: text("normalized_name").notNull(),
		albumId: text("album_id").notNull(),
		albumName: text("album_name").notNull(),
		albumReleaseDate: text("album_release_date"),
		artworkUrl: text("artwork_url"),
		durationMs: integer("duration_ms"),
		tier: text("tier").notNull().default("pool"),
		position: integer("position").notNull(),
	},
	(t) => [
		index("tier_list_track_list_idx").on(t.listId, t.position),
		unique("tier_list_track_canonical").on(t.listId, t.normalizedName),
	],
);

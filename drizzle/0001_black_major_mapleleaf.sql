CREATE TABLE "tier_list" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"slug" text NOT NULL,
	"user_id" text NOT NULL,
	"artist_id" text NOT NULL,
	"artist_name" text NOT NULL,
	"artist_image" text,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tier_list_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tier_list_track" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"list_id" uuid NOT NULL,
	"track_id" text NOT NULL,
	"uri" text NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"album_id" text NOT NULL,
	"album_name" text NOT NULL,
	"album_release_date" text,
	"artwork_url" text,
	"duration_ms" integer,
	"tier" text DEFAULT 'pool' NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "tier_list_track_canonical" UNIQUE("list_id","normalized_name")
);
--> statement-breakpoint
ALTER TABLE "tier_list" ADD CONSTRAINT "tier_list_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier_list_track" ADD CONSTRAINT "tier_list_track_list_id_tier_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."tier_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tier_list_user_idx" ON "tier_list" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tier_list_track_list_idx" ON "tier_list_track" USING btree ("list_id");

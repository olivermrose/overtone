DROP INDEX "tier_list_user_idx";--> statement-breakpoint
DROP INDEX "tier_list_track_list_idx";--> statement-breakpoint
CREATE INDEX "tier_list_user_idx" ON "tier_list" USING btree ("user_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "tier_list_track_list_idx" ON "tier_list_track" USING btree ("list_id","position");
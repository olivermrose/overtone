<script lang="ts" module>
	export interface Track {
		id: string;
		name: string;
		albumName: string;
		artworkUrl: string | null;
		tier: string;
		position: number;
	}
</script>

<script lang="ts">
	import { DragDropProvider } from "@dnd-kit/svelte";
	import { move } from "@dnd-kit/helpers";
	import Tier from "./Tier.svelte";
	import TierPool from "./TierPool.svelte";
	import AlbumPicker from "./AlbumPicker.svelte";
	import { removeTrack, saveList, type List } from "#lib/list.remote";

	interface Props {
		list: List;
		tracks: Track[];
	}

	const { list, tracks }: Props = $props();

	const tracksById = $derived(new Map(tracks.map((t) => [t.id, t])));
	let groups = $derived(group(tracks));

	let saveState = $state<"idle" | "saving" | "saved" | "error">("idle");
	let saveTimer: ReturnType<typeof setTimeout> | undefined = undefined;

	function group(tracks: Track[]) {
		const groups = [..."SABCDF", "pool"].reduce<Record<string, string[]>>(
			(g, t) => ({ ...g, [t]: [] }),
			{},
		);

		for (const track of tracks.toSorted((a, b) => a.position - b.position)) {
			groups[track.tier]?.push(track.id);
		}

		return groups;
	}

	function scheduleSave() {
		clearTimeout(saveTimer);
		saveState = "saving";

		saveTimer = setTimeout(async () => {
			try {
				await saveList({ slug: list.slug, groups });
				saveState = "saved";
			} catch {
				saveState = "error";
			}
		}, 800);
	}

	function resolveTracks(ids: string[]) {
		return ids.map((id) => tracksById.get(id)).filter((t) => typeof t !== "undefined");
	}

	async function remove(id: string) {
		await removeTrack({ slug: list.slug, trackId: id });
	}
</script>

<DragDropProvider
	onDragOver={(event) => {
		groups = move(groups, event);
	}}
	onDragEnd={(event) => {
		groups = move(groups, event);
		scheduleSave();
	}}
>
	<div class="flex-1">
		{#each "SABCDF" as tier}
			<Tier {tier} tracks={resolveTracks(groups[tier])} onremove={remove} />
		{/each}
	</div>

	<TierPool tracks={resolveTracks(groups.pool)} onremove={remove} />
</DragDropProvider>

<AlbumPicker slug={list.slug} artistId={list.artistId} />

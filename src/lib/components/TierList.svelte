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
	import type { List } from "#lib/list.remote";

	interface Props {
		list: List;
		tracks: Track[];
	}

	const { list, tracks }: Props = $props();

	const tracksById = $derived(new Map(tracks.map((t) => [t.id, t])));
	let groups = $derived(group(tracks));

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

	function resolveTracks(ids: string[]) {
		return ids.map((id) => tracksById.get(id)).filter((t) => typeof t !== "undefined");
	}
</script>

<DragDropProvider
	onDragOver={(event) => {
		groups = move(groups, event);
	}}
	onDragEnd={(event) => {
		groups = move(groups, event);
	}}
>
	<div class="flex-1">
		{#each "SABCDF" as tier}
			<Tier {tier} tracks={resolveTracks(groups[tier])} onremove={() => {}} />
		{/each}
	</div>

	<TierPool tracks={resolveTracks(groups.pool)} onremove={() => {}} />
</DragDropProvider>

<AlbumPicker slug={list.slug} artistId={list.artistId} />

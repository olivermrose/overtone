<script lang="ts" module>
</script>

<script lang="ts">
	import { DragDropProvider } from "@dnd-kit/svelte";
	import { move } from "@dnd-kit/helpers";
	import Tier from "./Tier.svelte";
	import TierPool from "./TierPool.svelte";
	import { setTierListContext, type Track } from "./context";

	interface Props {
		tracks: Track[];
	}

	const { tracks }: Props = $props();

	const context = $state({
		get tracks() {
			return tracks;
		},
		onremove: async () => {
			//
		},
	});

	setTierListContext(context);

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
			<Tier {tier} />
		{/each}
	</div>

	<TierPool />
</DragDropProvider>

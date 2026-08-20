<script lang="ts">
	import { createDroppable } from "@dnd-kit/svelte";
	import TrackComponent from "./Track.svelte";
	import type { Track } from "./TierList.svelte";

	interface Props {
		tracks: Track[];
		onremove: (id: string) => void;
	}

	const { tracks, onremove }: Props = $props();

	const droppable = createDroppable({
		id: "pool",
		type: "group",
		accept: "track",
	});
</script>

<details class="sticky bottom-0 z-20 border-t border-neutral-800 bg-black" open>
	<summary class="group flex cursor-pointer items-center gap-3 bg-neutral-900 px-2 py-2 text-xs">
		<span
			class="text-neutral-400 uppercase group-hover:text-white before:content-['▲_'] in-open:before:content-['▼_']"
		>
			Pool [{tracks.length}]
		</span>

		<span class="flex-1 truncate">unranked</span>

		<button
			class="bg-spotify hover:bg-spotify/85 px-3 py-1 font-bold text-black uppercase"
			type="button"
			command="show-modal"
			commandfor="album-picker"
		>
			+ Add Tracks
		</button>
	</summary>

	<div
		class={[
			"flex min-h-28 flex-wrap gap-1 p-1 transition-colors",
			droppable.isDropTarget && "bg-neutral-900",
		]}
		{@attach droppable.attach}
	>
		{#each tracks as track, i (track.id)}
			<TrackComponent {track} group="pool" index={i} {onremove} />
		{:else}
			<span class="self-center px-2 text-xs text-neutral-400">no tracks added</span>
		{/each}
	</div>
</details>

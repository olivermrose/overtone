<script lang="ts">
	import { createSortable } from "@dnd-kit/svelte/sortable";
	import type { Track } from "./TierList.svelte";

	interface Props {
		track: Track;
		group: string;
		index: number;
		onremove?: (id: string) => void;
	}

	const { track, group, index, onremove }: Props = $props();

	const sortable = createSortable({
		type: "track",
		accept: "track",
		get id() {
			return track.id;
		},
		get index() {
			return index;
		},
		get group() {
			return group;
		},
	});
</script>

<div
	class={[
		"group relative aspect-square w-24 shrink-0 overflow-hidden border border-neutral-800 bg-neutral-900 select-none",
		sortable.isDragging && "opacity-40",
	]}
	{@attach sortable.attach}
>
	{#if track.artworkUrl}
		<img
			class="absolute inset-0 size-full object-cover opacity-45 transition-opacity group-hover:opacity-30"
			src={track.artworkUrl}
			alt={track.albumName}
			loading="lazy"
			draggable="false"
		/>
	{/if}

	<span
		class="absolute inset-x-0 bottom-0 line-clamp-2 bg-linear-to-t from-black/90 to-transparent px-1 pt-3 pb-1 text-[10px] leading-tight wrap-break-word"
	>
		{track.name}
	</span>

	{#if onremove}
		<button
			class="hover:text-spotify absolute top-0 right-0 hidden size-5 items-center justify-center bg-black/80 text-xs text-white group-hover:flex"
			type="button"
			onclick={(event) => {
				event.stopPropagation();
				onremove(track.id);
			}}
		>
			&times;
		</button>
	{/if}
</div>

<script lang="ts">
	import { createDroppable } from "@dnd-kit/svelte";
	import TrackComponent from "./Track.svelte";
	import type { Track } from "./TierList.svelte";

	interface Props {
		tier: string;
		tracks: Track[];
		onremove: (id: string) => void;
	}

	const { tier, tracks, onremove }: Props = $props();

	const TIER_COLORS: Record<string, string> = {
		S: "#ff7f7f",
		A: "#ffbf7f",
		B: "#ffdf7f",
		C: "#ffff7f",
		D: "#bfff7f",
		F: "#7fbfff",
	};

	const droppable = createDroppable({
		type: "group",
		accept: "track",
		get id() {
			return tier;
		},
	});
</script>

<div class="flex border-b border-neutral-800 last:border-b-0">
	<div
		class="grid w-20 shrink-0 place-items-center border-r border-neutral-800 text-2xl font-bold text-black"
		style:background-color={TIER_COLORS[tier]}
	>
		{tier}
	</div>

	<div
		class={[
			"flex min-h-26 flex-1 flex-wrap content-start gap-1 p-1 transition-colors",
			droppable.isDropTarget && "bg-neutral-900",
		]}
		{@attach droppable.attach}
	>
		{#each tracks as track, i (track.id)}
			<TrackComponent {track} group={tier} index={i} {onremove} />
		{/each}
	</div>
</div>

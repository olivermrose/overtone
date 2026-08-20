<script lang="ts">
	import TierList from "#lib/components/TierList.svelte";
	import { getList } from "#lib/list.remote";
	import { page } from "$app/state";

	const { list, tracks } = $derived(await getList(page.params.slug!));

	const defaultTitle = $derived(`${list.artistName} Tier List`);

	let editingTitle = $state(false);
	let title = $derived(list.title ?? defaultTitle);

	async function saveTitle() {
		title = title.trim();

		if (!title || title === list.title?.trim()) {
			return;
		}
	}
</script>

<div class="flex flex-1 flex-col">
	<header class="flex flex-wrap items-center gap-3 border-b border-neutral-800 p-4">
		{#if list.artistImage}
			<img
				src={list.artistImage}
				alt={list.artistName}
				class="aspect-square size-10 object-cover"
			/>
		{/if}

		<div class="min-w-0 flex-1">
			{#if editingTitle}
				<input
					class="w-full border border-neutral-800 bg-neutral-900 px-2 py-1 text-sm"
					onblur={saveTitle}
					onkeydown={(event) => {
						if (event.key === "Enter") saveTitle();

						if (event.key === "Escape") {
							title = defaultTitle;
							editingTitle = false;
						}
					}}
					bind:value={title}
				/>
			{:else}
				<button
					class="hover:text-spotify block max-w-full truncate text-left text-sm"
					type="button"
					onclick={() => (editingTitle = true)}
				>
					{title}
				</button>
			{/if}
		</div>
	</header>

	<TierList {list} {tracks} />
</div>

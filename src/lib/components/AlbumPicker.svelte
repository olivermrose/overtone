<script lang="ts">
	import { addTracks } from "#lib/list.remote";
	import { getAlbums } from "#lib/spotify.remote";

	interface Props {
		slug: string;
		artistId: string;
	}

	const { slug, artistId }: Props = $props();

	let busy = $state(false);
	let selected = $state.raw<string[]>([]);
	let added = $state(0);

	function toggle(id: string) {
		selected = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
	}

	async function add() {
		if (selected.length === 0) return;

		busy = true;

		try {
			added = await addTracks({ slug, ids: selected });
			selected = [];
		} finally {
			busy = false;
		}
	}
</script>

<dialog
	id="album-picker"
	class="fixed inset-0 z-50 m-auto max-h-[calc(100%-4rem)] w-full max-w-3xl flex-col items-start justify-center border border-neutral-800 bg-black backdrop:bg-black/80 open:flex"
>
	<header class="flex w-full items-center gap-3 border-b border-neutral-800 px-4 py-3">
		<h2 class="flex-1 text-sm tracking-widest text-white uppercase">Select Albums</h2>

		<button
			class="text-neutral-400 hover:text-white"
			type="button"
			command="close"
			commandfor="album-picker"
		>
			&times;
		</button>
	</header>

	<div class="w-full flex-1 overflow-y-auto">
		{const albums = $derived(await getAlbums(artistId))}

		{#if albums.length === 0}
			<!--  -->
		{:else}
			<ul>
				{#each albums as album (album.id)}
					{const picked = $derived(selected.includes(album.id))}

					<li>
						<button
							class={[
								"flex w-full items-center gap-3 border-b border-neutral-800 px-4 py-2 text-left hover:bg-neutral-900",
								picked && "bg-neutral-900",
							]}
							onclick={() => toggle(album.id)}
						>
							<span
								class={[
									"grid size-3 shrink-0 place-items-center border",
									picked ? "border-spotify bg-spotify" : "border-neutral-800",
								]}
							>
							</span>

							{#if album.artworkUrl}
								<img
									class="size-10 object-cover opacity-70"
									src={album.artworkUrl}
									alt={album.name}
								/>
							{/if}

							<div class="min-w-0 flex-1">
								<span class="block truncate text-sm text-white">{album.name}</span>

								<span class="block text-xs text-neutral-400">
									{album.group} &bullet; {album.releaseDate} &bullet; {album.trackCount}
									tracks
								</span>
							</div>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<footer
		class="flex w-full items-center justify-between gap-3 border-t border-neutral-800 px-4 py-3 text-xs"
	>
		<p class="flex-1 text-neutral-400">
			{#if added > 0}
				Added {added}
			{:else}
				{selected.length} selected
			{/if}
		</p>

		<button
			class="bg-spotify px-4 py-1.5 font-bold text-black uppercase disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-400"
			type="button"
			disabled={selected.length === 0 || busy}
			onclick={add}
		>
			{busy ? "Adding..." : "Add"}
		</button>
	</footer>
</dialog>

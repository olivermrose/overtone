<script lang="ts">
	import { searchArtists, type Artist } from "#lib/spotify.remote";
	import { Debounced } from "runed";

	let query = $state("");

	const search = new Debounced(async () => {
		return query ? await searchArtists(query) : [];
	}, 300);

	async function select(artist: Artist) {
		//
	}
</script>

<div class="mx-auto w-full max-w-4xl px-4 py-10">
	<label class="block">
		<span class="text-sm tracking-widest text-neutral-400 uppercase">Search an artist</span>

		<input
			class={[
				"mt-2 w-full border border-neutral-800 bg-neutral-900 p-3 text-lg",
				"outline-spotify focus-visible:outline-2 focus-visible:outline-offset-1",
			]}
			type="search"
			autocomplete="off"
			bind:value={query}
		/>
	</label>

	{const artists = $derived(await search.current)}

	{#if artists.length > 0}
		<ul class="mt-2 border border-neutral-800 py-1">
			{#each artists as artist (artist.id)}
				<li>
					<button
						class="flex w-full items-center gap-2 px-3 py-2 hover:bg-neutral-900"
						type="button"
						onclick={() => select(artist)}
					>
						{#if artist.image}
							<img
								class="size-10 object-cover"
								src={artist.image}
								alt={artist.name}
							/>
						{/if}

						<span class="truncate text-sm">{artist.name}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

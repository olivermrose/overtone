<script lang="ts">
	import { spotifySignIn } from "#lib/auth-client";
	import ArtistSearch from "#lib/components/ArtistSearch.svelte";
	import { getUserLists } from "#lib/list.remote";
	import { getUser } from "#lib/spotify.remote";
</script>

{const user = await getUser()}

{#if !user}
	<button type="button" onclick={() => spotifySignIn()}> sign in </button>
{:else}
	<ArtistSearch />

	{const lists = await getUserLists()}

	{#if lists.length === 0}
		<!--  -->
	{:else}
		<ul>
			{#each lists as list (list.slug)}
				<li>
					<div
						class="hover:border-spotify relative flex items-center gap-3 border border-neutral-800 p-2"
					>
						<a class="absolute inset-0 z-1" href="/list/{list.slug}">
							<span class="sr-only">Go to tier list</span>
						</a>

						{#if list.artistImage}
							<img
								class="size-12 object-cover"
								src={list.artistImage}
								alt={list.artistName}
							/>
						{/if}

						<div class="min-w-0 flex-1">
							<span class="block truncate text-sm"
								>{list.title || list.artistName}</span
							>

							<span class="block text-xs text-neutral-400">
								{list.trackCount} tracks &bullet; edited {new Date(
									list.updatedAt,
								).toLocaleDateString()}
							</span>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
{/if}

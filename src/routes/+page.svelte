<script lang="ts">
	import { spotifySignIn } from "#lib/auth-client";
	import ArtistSearch from "#lib/components/ArtistSearch.svelte";
	import { getUser } from "#lib/spotify.remote";
</script>

{const user = $derived(await getUser())}

{#if !user}
	<button type="button" onclick={() => spotifySignIn()}> sign in </button>
{:else}
	<ArtistSearch />
{/if}

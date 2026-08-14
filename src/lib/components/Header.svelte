<script lang="ts">
	import { getUser } from "#lib/spotify.remote";
</script>

{const user = $derived(await getUser())}

<header class="flex items-center justify-between gap-4 border-b border-neutral-800 p-4">
	<a href="/">[placeholder]</a>

	{#if user}
		<div class="flex items-center gap-2">
			<img src={user.image} alt={user.name} class="aspect-square size-8 object-cover" />

			<span>{user.name}</span>
		</div>
	{/if}
</header>

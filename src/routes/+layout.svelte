<script lang="ts">
	import "./layout.css";
	import "geist-svelte/font/pixel";
	import favicon from "#lib/assets/favicon.svg";
	import Header from "#lib/components/Header.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Header />

<main>
	{@render children()}
</main>

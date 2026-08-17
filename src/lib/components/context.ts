import { createContext } from "svelte";

export interface Track {
	id: string;
	name: string;
	albumName: string;
	artworkUrl: string | null;
	tier: string;
	position: number;
}

interface TierListContext {
	tracks: Track[];
	onremove?: (id: string) => void;
}

export const [useTierList, setTierListContext] = createContext<TierListContext>();

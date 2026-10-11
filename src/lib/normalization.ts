const VERSION_SUFFIX =
	/\s*[-–—([]\s*(remaster(ed)?|re-?master(ed)?|\d{4}\s+remaster(ed)?|mono|stereo|deluxe|expanded|bonus\s+track|radio\s+edit|single\s+version|album\s+version|anniversary|edit|explicit|clean)[^)\]]*[)\]]?\s*$/i;

const FEATURE_SUFFIX = /\s*[([]\s*(feat|ft|featuring|with)\.?\s[^)\]]*[)\]]\s*/gi;

export type ReleaseGroup = "album" | "single" | "compilation" | "appears_on";

export interface CandidateRecording {
	trackId: string;
	name: string;
	albumGroup: ReleaseGroup;
	albumReleaseDate?: string | null;
}

const GROUP_RANK: Record<ReleaseGroup, number> = {
	album: 0,
	single: 1,
	compilation: 2,
	appears_on: 3,
};

export function normalizeTrackName(name: string): string {
	let out = name.toLowerCase();
	out = out.replace(FEATURE_SUFFIX, " ");

	let previous: string;

	do {
		previous = out;
		out = out.replace(VERSION_SUFFIX, "");
	} while (out !== previous);

	out = out.replace(/[^\p{L}\p{N}\s]/gu, " ");

	return out.replace(/\s+/g, " ").trim();
}

function releaseSortKey(date?: string | null): string {
	if (!date) return "0000-00-00";

	// Pad partial dates so string comparison stays chronological.
	const [year, month = "00", day = "00"] = date.split("-");
	return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function pickCanonical<T extends CandidateRecording>(candidates: T[]): T {
	return candidates.reduce((best, candidate) => {
		const groupDelta = GROUP_RANK[candidate.albumGroup] - GROUP_RANK[best.albumGroup];

		if (groupDelta !== 0) {
			return groupDelta < 0 ? candidate : best;
		}

		const dateDelta = releaseSortKey(candidate.albumReleaseDate).localeCompare(
			releaseSortKey(best.albumReleaseDate),
		);

		return dateDelta > 0 ? candidate : best;
	});
}

export function dedupeToCanonical<T extends CandidateRecording>(candidates: T[]): T[] {
	const bySong = new Map<string, T[]>();

	for (const candidate of candidates) {
		const key = normalizeTrackName(candidate.name);
		const group = bySong.get(key);

		if (group) {
			group.push(candidate);
		} else {
			bySong.set(key, [candidate]);
		}
	}

	return [...bySong.values()].map(pickCanonical);
}

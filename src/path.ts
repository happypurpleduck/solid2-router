import type { Location } from "./types.ts";

export function parsePath(path: string): Location {
	if (URL.canParse(path)) {
		const url = new URL(path);
		return {
			pathname: url.pathname,
			search: Object.fromEntries(url.searchParams.entries()),
			hash: url.hash,
		};
	}

	const [pathnamePart, hashPart] = path.split("#");
	const [pathname, queryString] = pathnamePart.split("?");

	const search = Object.fromEntries(new URLSearchParams(queryString).entries());

	return {
		pathname: pathname || "/",
		search,
		hash: hashPart || "",
	};
}

import type { FlatRoutes, Paths } from "./router.tsx";

export function resolveNavigationPath(path: string, search?: unknown): string {
	if (typeof search === "object" && search !== null) {
		const queryString = new URLSearchParams(search as Record<string, string>).toString();
		if (queryString) {
			path += `?${queryString}`;
		}
	}

	return path;
}

export function navigate<const Path extends Paths, Route extends Extract<FlatRoutes, { "~types": { path: Path } }>>(
	opts: {
		to: Path;
		search?: Route["~types"] extends { search: { in: infer S } } ? S : never;
		replace?: true;
	},
) {
	const path = resolveNavigationPath(
		String(opts.to),
		opts.search,
	);

	// TODO: use window.navigation?
	if (opts.replace) {
		window.history.replaceState({}, "", path);
	}
	else {
		window.history.pushState({}, "", path);
	}
}

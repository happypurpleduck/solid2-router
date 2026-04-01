import type { FlatRoutes, Paths } from "./router.tsx";

export function resolveNavigationPath(
	path: string,
	params: Record<string, string> | undefined,
	search: unknown,
): string {
	if (params && typeof params === "object" && params !== null) {
		for (const [key, value] of Object.entries(params as Record<string, string>)) {
			path = path.replace(`$${key}`, value);
		}
	}

	if (typeof search === "object" && search !== null) {
		const queryString = new URLSearchParams(search as Record<string, string>).toString();
		if (queryString) {
			path += `?${queryString}`;
		}
	}

	return path;
}

export function navigate<
	const Path extends Paths,
	Route extends Extract<FlatRoutes, { "~types": { path: Path } }>,
>(
	opts: {
		to: Path;
		search?: Route["~types"] extends { search: { in: infer S } } ? S : never;
		replace?: true;
	} & (
			Route["~types"]["params"] extends Record<string, string>
				? {
						to: Path;
						params: Route["~types"]["params"];
					}
				: {
						to: Path;
						params?: never;
					}

	),
) {
	const path = resolveNavigationPath(
		String(opts.to),
		opts.params ?? {},
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

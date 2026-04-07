import type { Accessor, Component, JSX, Setter } from "solid-js";
import type { routes } from "../dev/src/app.tsx";
import type { AnyRoute, AnyRouter, RouteLike, RouteLikeContext, RouteSchema } from "./types.ts";
import { createEffect, createSignal, onSettled } from "solid-js";
import { RouteOutletContext, RouterContext } from "./context.ts";
import { Outlet } from "./outlet.tsx";
import { parsePath } from "./path.ts";
import { Route } from "./route.ts";

export interface TRouterState {
	dirty: boolean;
	staticRoutes: Map<string, Route[]>;
	dynamicRoutes: Map<string, { regex: RegExp; routes: Route[] }>;

	location: {
		original: string;
		pathname: string;
		search: Record<string, string>;
		hash: string;
	};

	resolved: {
		path: Paths;
		routes: Route[];
		params: Record<string, string>;
	};
}

export class Router<
	const T extends AnyRoute[] = [],
	const P extends `/${string}` = "/",
> {
	readonly path: P;
	// @ts-expect-error ... TODO:
	readonly children: T = [];
	readonly notFoundComponent: Component;

	declare "~types": RouteLikeContext<P, null, { in: never; out: never }>;

	state: Accessor<TRouterState>;
	setState: Setter<TRouterState>;

	setDirty: (value: boolean) => void;

	constructor({ path, notFoundComponent }: { path: P; notFoundComponent: Component }) {
		this.path = path;
		this.notFoundComponent = notFoundComponent;

		// TODO: use store?
		const [state, setState] = createSignal<TRouterState>({
			// TODO: probably isolate into a different signal
			dirty: false,
			staticRoutes: new Map(),
			dynamicRoutes: new Map(),

			location: {
				original: window.location.pathname,
				...parsePath(window.location.pathname),
			},

			resolved: {
				// TODO: get as input for base route?
				// OR: use current path.
				path: "/" as Paths,
				routes: [],
				params: {},
			},
		});
		this.state = state;
		this.setState = setState;

		this.setDirty = (value: boolean) => {
			setState(prev => ({ ...prev, dirty: value }));
		};
	}

	#resolve(
		pathname: string,
		staticRoutes: Map<string, Route[]>,
		dynamicRoutes: Map<string, { regex: RegExp; routes: Route[] }>,
	): TRouterState["resolved"] {
		const resolved: TRouterState["resolved"] = {
			path: "/" as Paths,
			params: {} as Record<string, string>,
			routes: [] as Route[],
		};

		const staticRoute = staticRoutes.get(pathname);
		if (staticRoute) {
			resolved.path = pathname as Paths;
			resolved.routes = staticRoute;
		}
		else {
			for (const [path, { regex, routes }] of dynamicRoutes) {
				const result = regex.exec(pathname);
				if (result) {
					resolved.path = path as Paths;
					resolved.params = result.groups ?? {};
					resolved.routes = routes;
				}
			}
		}

		return resolved;
	}

	#process(
		staticRoutes: Map<string, Route[]>,
		dynamicRoutes: Map<string, { regex: RegExp; routes: Route[] }>,
		chain: Route[],
		parentPath: string,
	) {
		const self = chain.at(-1);
		if (!self) {
			return;
		}

		const path = join(parentPath, self.path);

		if (self instanceof Route) {
			if (path.includes("$")) {
				const slices = path.split("/");
				const regexpstr: string[] = [];

				for (let i = 0; i < slices.length; i++) {
					if (slices[i].startsWith("$")) {
						const name = slices[i].slice(1);
						regexpstr.push(`(?<${name}>[^/]+)`);
					}
					else {
						regexpstr.push(slices[i]);
					}
				}

				const regex = new RegExp(regexpstr.join("/"), "i");
				dynamicRoutes.set(path, { regex, routes: chain });
			}
			else {
				staticRoutes.set(path, chain);
			}
		}

		for (const child of self.children) {
			this.#process(
				staticRoutes,
				dynamicRoutes,
				chain.concat(child),
				path,
			);
		}
	};

	#compute(): void {
		const staticRoutes = new Map<string, Route[]>();
		const dynamicRoutes = new Map<string, { regex: RegExp; routes: Route[] }>();

		for (const child of this.children) {
			this.#process(
				staticRoutes,
				dynamicRoutes,
				[child as Route],
				this.path,
			);
		}

		this.setState(state => ({
			...state,
			staticRoutes,
			dynamicRoutes,
			resolved: this.#resolve(state.location.pathname, staticRoutes, dynamicRoutes),
			dirty: false,
		}));
	}

	addChildren<const U extends AnyRoute[]>(children: U): Router<[...T, ...U]> {
		// @ts-expect-error override
		this.children = this.children.concat(children);

		// TODO: this need to ensure that it's on the same level while checking and is the last section.
		// such that:
		// - /a/$a
		// - /a/$b/a
		// is allowed.
		// if (DEV) {
		// 	let hasParamRoute = false;
		// 	for (const child of this.children) {
		// 		if (child.path.startsWith("$")) {
		// 			if (hasParamRoute) {
		// 				// TODO: add more context to the error
		// 				throw new Error("Multiple parameter routes are not allowed on the same level");
		// 			}
		// 			hasParamRoute = true;
		// 		}
		// 	}
		// }

		this.#compute();

		// @ts-expect-error override
		return this;
	}

	get Render(): () => JSX.Element {
		return () => {
			createEffect(
				() => this.state().dirty,
				(dirty) => {
					if (dirty) {
						this.#compute();
					}
				},
			);

			onSettled(() => {
				const handler = (event: NavigateEvent) => {
					const location = {
						original: event.destination.url,
						...parsePath(event.destination.url),
					};

					this.setState(state => ({
						...state,
						location,
						resolved: this.#resolve(location.pathname, state.staticRoutes, state.dynamicRoutes),
					}));
				};

				window.navigation.addEventListener("navigate", handler);

				return () => {
					navigation.removeEventListener("navigate", handler);
				};
			});

			return (
				<RouterContext value={[this.state, this.setState]}>
					<RouteOutletContext value={{ depth: 0 }}>
						<Outlet />
					</RouteOutletContext>
				</RouterContext>
			);
		};
	}
}

type FlattenRoutes<T extends RouteLike>
	= T extends Router<infer R extends AnyRoute[], any>
		? FlattenRoutes<R[number]>
		: T extends AnyRoute
			? T | FlattenRoutes<T["children"][number]>
			: never;

export type RouterPaths<T extends RouteLike> = T["~types"]["path"];

export interface R {
	router: typeof routes;
}

type TheRouter = R extends { router: infer R extends AnyRouter }
	? R
	: Router<[Route<string, null, RouteSchema, []>], "/">;

export type FlatRoutes = FlattenRoutes<TheRouter>;
export type Paths = RouterPaths<FlatRoutes>;

function join(parentPath: string, path: string) {
	if (path.startsWith("/")) {
		path = path.substring(1);
	}
	if (path.endsWith("/")) {
		path = path.substring(0, path.length - 1);
	}
	if (!parentPath.endsWith("/")) {
		parentPath += "/";
	}

	return parentPath + path;
}

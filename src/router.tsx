import type { Accessor, Component, JSX, Setter } from "solid-js";
import type { routes } from "../dev/src/app.tsx";
import type { AnyRoute, AnyRouter, PathParams, RouteLike, RouteLikeContext, RouteSchema } from "./types.ts";
import { createEffect, createMemo, createSignal, DEV, onSettled } from "solid-js";
import { RouteContext } from "./context.ts";
import { Outlet } from "./outlet.tsx";
import { parsePath } from "./path.ts";
import { Route } from "./route.ts";

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

const [location, setLocation] = createSignal(parsePath(window.location.toString()));

export class Router<
	const T extends AnyRoute[] = [],
	const P extends `/${string}` = "/",
> {
	readonly path: P;
	// @ts-expect-error ... TODO:
	readonly children: T = [];
	readonly notFoundComponent: Component;

	#static = new Map<string, Route[]>();
	#dynamic = new Map<string, { regex: RegExp; routes: Route[] }>();

	declare "~types": RouteLikeContext<P, PathParams<P>, { in: never; out: never }>;

	#dirty: Accessor<boolean>;
	setDirty: Setter<boolean>;

	constructor({ path, notFoundComponent }: { path: P; notFoundComponent: Component }) {
		this.path = path;
		this.notFoundComponent = notFoundComponent;

		const [dirty, setDirty] = createSignal(false);
		this.#dirty = dirty;
		this.setDirty = setDirty;
	}

	#process(chain: Route[], parentPath: string) {
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
				this.#dynamic.set(path, { regex, routes: chain });
			}
			else {
				this.#static.set(path, chain);
			}
		}

		for (const child of self.children) {
			this.#process(chain.concat(child), path);
		}
	};

	#compute(): void {
		this.#static.clear();
		this.#dynamic.clear();

		for (const child of this.children) {
			this.#process([child as Route], this.path);
		}
	}

	addChildren<const U extends AnyRoute[]>(children: U): Router<[...T, ...U]> {
		// @ts-expect-error override
		this.children = this.children.concat(children);

		if (DEV) {
			let hasParamRoute = false;
			for (const child of this.children) {
				if (child.path.startsWith("$")) {
					if (hasParamRoute) {
						// TODO: add more context to the error
						throw new Error("Multiple parameter routes are not allowed on the same level");
					}
					hasParamRoute = true;
				}
			}
		}

		this.#compute();

		// @ts-expect-error override
		return this;
	}

	get Render(): () => JSX.Element {
		return () => {
			createEffect(
				this.#dirty,
				(dirty) => {
					if (dirty) {
						this.#compute();
						// TODO: this is probably bad.
						this.setDirty(false);
					}
				},
			);

			onSettled(() => {
				const handler = (event: NavigateEvent) => {
					setLocation(parsePath(event.destination.url));
				};

				navigation.addEventListener("navigate", handler);

				return () => {
					navigation.removeEventListener("navigate", handler);
				};
			});

			const resolve = createMemo((): {
				params: Record<string, string>;
				routes: Route[];
				search: Record<string, string>;
			} => {
				const l = location();
				const search = l.search;
				let params: Record<string, string> = {};

				const staticRoute = this.#static.get(l.pathname);
				if (staticRoute) {
					return {
						routes: staticRoute as Route[],
						params,
						search,
					};
				}

				for (const { regex, routes } of this.#dynamic.values()) {
					const result = regex.exec(l.pathname);
					if (result) {
						if (result.groups) {
							params = result.groups;
						}

						return {
							routes,
							params,
							search,
						};
					}
				}

				// TODO: 404

				return {
					routes: [],
					params,
					search,
				};
			});

			return (
				<RouteContext
					value={{
						routes: () => resolve().routes,
						search: () => resolve().search,
						params: () => resolve().params,
						depth: 0,
					}}
				>
					<Outlet />
				</RouteContext>
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

import type { Component, JSX } from "solid-js";
import type { Route } from "./route.ts";
import type { AnyRoute, AnyRouter, RouteLike, RoutePath, RouteSchema } from "./types.ts";
import { createMemo, createSignal, DEV, onSettled } from "solid-js";
import { RouteContext } from "./context.ts";
import { Outlet } from "./outlet.tsx";
import { parsePath } from "./path.ts";

const [location, setLocation] = createSignal(parsePath(window.location.toString()));

export class Router<const T extends AnyRoute[] = [], const P extends string = ""> implements RouteLike {
	readonly path: P;
	// @ts-expect-error ... TODO:
	readonly children: T = [];

	constructor(path: P) {
		this.path = path;
	}

	declare "~types": {
		parent: null;
		path: RoutePath<P, null>;
		children: T;
	};

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
		// @ts-expect-error override
		return this;
	}

	get Render(): () => JSX.Element {
		return () => {
			onSettled(() => {
				const handler = (event: NavigateEvent) => {
					setLocation(parsePath(event.destination.url));
				};

				navigation.addEventListener("navigate", handler);

				return () => {
					navigation.removeEventListener("navigate", handler);
				};
			});

			// memo not needed?
			const routes = createMemo(() => {
				let routes: AnyRoute[] = [];
				const l = location();

				const slices = l.pathname.split("/");
				slices.shift();

				const firstSlice = slices.shift() ?? "";
				const root = this.children.find(c => c.normalizedPath === firstSlice);
				// TODO: support catch-all (404)
				if (!root) {
					return routes;
				}

				routes.push(root);

				while (slices.length) {
					const segment = slices.shift()!;
					const children = routes.at(-1)?.children;

					const found = children?.find((c) => {
						return c.normalizedPath === segment;
					}) ?? children?.find((c) => {
						// TODO: should add a in dev mode warning to disallow multiple $ routes on the same level.
						return c.normalizedPath.startsWith("$");
					});

					if (found) {
						routes.push(found);
					}
					else {
						routes = [];
						break;
					}
				}

				return routes;
			});

			return (
				<RouteContext
					value={{
						routes,
						params: {},
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
	= T extends AnyRoute
		? T | FlattenRoutes<T["~types"]["children"][number]>
		: T extends AnyRouter
			? FlattenRoutes<T["~types"]["children"][number]>
			: never;

export type RouterPaths<T extends RouteLike> = T["~types"]["path"];

export interface R {
	// router: typeof routes;
}

type TheRouter = R extends { router: infer R extends Router<any, any> }
	? R
	: Router<[Route<Component, string, null, RouteSchema, []>], "">;

export type FlatRoutes = FlattenRoutes<TheRouter>;
export type Paths = RouterPaths<FlatRoutes>;

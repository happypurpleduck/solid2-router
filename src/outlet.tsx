import type { Paths } from "./router.tsx";
import { Dynamic } from "@solidjs/web";
import { createEffect, createMemo } from "solid-js";
import { RouteOutletContext, useRouterContext, useRouterOutletContext } from "./context.ts";
import { navigate } from "./navigate.ts";

export function Outlet() {
	const [routerContext] = useRouterContext();
	const outletContext = useRouterOutletContext();

	const state = createMemo(() => routerContext());
	const currentRoute = createMemo(() => state().resolved.routes[outletContext.depth]);
	const RouteComponent = createMemo(() => currentRoute()?.Component);

	createEffect(
		() => {
			const route = currentRoute();
			const routes = state().resolved.routes;
			const isLeaf = outletContext.depth === routes.length - 1;
			if (route?.redirect && isLeaf) {
				return { redirect: route.redirect, resolvedPath: state().resolved.path };
			}
			return null;
		},
		(redirectInfo) => {
			if (!redirectInfo) {
				return;
			}

			navigate({
				to: redirectInfo.redirect as Paths,
				replace: true,
			});
		},
	);

	return (
		<RouteOutletContext value={{ depth: outletContext.depth + 1 }}>
			<Dynamic
				component={RouteComponent()}
				route={{
					params: state().resolved.params,
					setParams(params, opts) {
						const currentState = state();

						navigate({
							to: currentState.resolved.path,
							params: typeof params === "function"
								? params(currentState.resolved.params)
								: params,
							search: currentState.location.search,
							replace: opts?.replace,
						});
					},
					search: state().location.search,
					setSearch(search, opts) {
						const currentState = state();
						navigate({
							to: currentState.resolved.path,
							params: currentState.resolved.params as any,
							search,
							replace: opts?.replace,
						});
					},
				}}
			/>
		</RouteOutletContext>
	);
}

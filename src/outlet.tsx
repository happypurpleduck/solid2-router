import type { Paths } from "./router.tsx";
import { Dynamic } from "@solidjs/web";
import { createMemo } from "solid-js";
import { RouteOutletContext, useRouterContext, useRouterOutletContext } from "./context.ts";
import { navigate } from "./navigate.ts";

export function Outlet() {
	const routerContext = useRouterContext();
	const outletContext = useRouterOutletContext();

	const RouteComponent = createMemo(() => routerContext[0]().resolved.routes[outletContext.depth]?.Component);

	return (
		<RouteOutletContext value={{ depth: outletContext.depth + 1 }}>
			<Dynamic
				component={RouteComponent()}
				route={{
					params: routerContext[0]().resolved.params,
					setParams(params, opts) {
						const state = routerContext[0]();

						navigate({
							to: state.resolved.path as Paths,
							params: typeof params === "function"
								? params(state.resolved.params)
								: params,
							search: state.location.search,
							replace: opts?.replace,
						});
					},
					search: routerContext[0]().location.search,
					setSearch(search, opts) {
						const state = routerContext[0]();

						navigate({
							to: state.resolved.path as Paths,
							params: state.resolved.params as any,
							search,
							replace: opts?.replace,
						});
					},
				}}
			/>
		</RouteOutletContext>
	);
}

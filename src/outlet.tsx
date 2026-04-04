import { Dynamic } from "@solidjs/web";
import { createMemo } from "solid-js";
import { RouteOutletContext, useRouterContext, useRouterOutletContext } from "./context.ts";

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
					setParams(params) {
						routerContext[1](s => ({
							...s,
							resolved: {
								...s.resolved,
								params: typeof params === "function" ? params(s.resolved.params) : params ?? s.resolved.params,
							},
						}));
					},
					search: routerContext[0]().location.search,
				}}
			/>
		</RouteOutletContext>
	);
}

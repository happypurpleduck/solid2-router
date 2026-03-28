import { createMemo } from "solid-js";
import { RouteContext, useRouterContext } from "./context.ts";

export function Outlet() {
	const context = useRouterContext();

	const route = createMemo(() => typeof context.routes === "function"
		? context.routes()[context.depth]
		: context.routes[context.depth]);

	return (
		<RouteContext value={{
			routes: context.routes,
			params: context.params,
			depth: context.depth + 1,
		}}
		>
			{route()?.Component({})}
		</RouteContext>
	);
}

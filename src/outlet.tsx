import { Dynamic } from "@solidjs/web";
import { createMemo } from "solid-js";
import { RouteContext, useRouterContext } from "./context.ts";

export function Outlet() {
	const context = useRouterContext();

	const route = createMemo(() => context.routes()[context.depth]);

	return (
		<RouteContext value={{
			routes: context.routes,
			params: context.params,
			search: context.search,
			depth: context.depth + 1,
		}}
		>
			<Dynamic
				component={route()?.Component}
				route={{
					params: context.params(),
					search: context.search(),
				}}
			/>
		</RouteContext>
	);
}

// <Show when={route()}>
// 				{route => <route.Component route={{ params: context.params(), search: context.search() }} />}
// 			</Show>

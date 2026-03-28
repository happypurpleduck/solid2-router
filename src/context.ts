import type { TRouteContext } from "./types.ts";
import { createContext, useContext } from "solid-js";

export const RouteContext = createContext<TRouteContext>();
export function useRouterContext(): TRouteContext {
	const context = useContext(RouteContext);
	if (!context) {
		throw new Error("useRouterContext must be used within a <Route> component");
	}
	return context;
}

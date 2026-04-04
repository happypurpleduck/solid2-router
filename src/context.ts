import type { Signal } from "solid-js";
import type { TRouterState } from "./router.tsx";
import { createContext, useContext } from "solid-js";

export const RouterContext = createContext<Signal<TRouterState>>();
export function useRouterContext(): Signal<TRouterState> {
	const context = useContext(RouterContext);
	if (!context) {
		throw new Error("useRouterContext must be used within a <Router> component");
	}
	return context;
}

export interface TRouteOutletContext {
	depth: number;
}

export const RouteOutletContext = createContext<TRouteOutletContext>();
export function useRouterOutletContext(): TRouteOutletContext {
	const context = useContext(RouteOutletContext);
	if (!context) {
		throw new Error("useRouterOutletContext must be used within a <Router> component");
	}
	return context;
}

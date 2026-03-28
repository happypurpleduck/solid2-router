import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Accessor } from "solid-js";
import type { Route } from "./route.ts";
import type { Router } from "./router.tsx";

export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export interface RouteLike {
	"~types": {
		parent: RouteLike | null;
		path: string;
		children: RouteLike[];
	};
}

export interface RouteSchema {
	// params?: StandardSchemaV1;
	search?: StandardSchemaV1;
}

export type AnyRouter = Router<AnyRoute[], "">;
export type AnyRoute = Route<any, string, any, RouteSchema, AnyRoute[]>;

export interface Location {
	pathname: string;
	search: Record<string, string>;
	hash: string;
}

export type PathParams<TPath extends string>
	= TPath extends `${infer _A}/${infer Rest}`
		? (_A extends `$${infer Name}` ? { [K in Name]: string } : unknown) & PathParams<Rest>
		: TPath extends `$${infer Name}`
			? { [K in Name]: string }
			: never;

export interface TRouteContext {
	/** @internal */
	routes: AnyRoute[] | Accessor<AnyRoute[]>;
	/** @internal */
	params: Record<string, string>;
	/** @internal */
	depth: number;
}

type NormalizedRoutePath<TPath extends string>
	= TPath extends "/" | ""
		? ""
		: TPath extends `/${infer R}/`
			? R
			: TPath extends `${infer R}/`
				? R
				: TPath extends `/${infer R}`
					? R
					: TPath;

type NormalizeParentPath<TPath extends string> = TPath extends `/${string}/`
	? TPath
	: TPath extends `/${infer Path extends string}`
		? Path extends "" ? "/" : `/${Path}/`
		: TPath extends `${infer Path extends string}/`
			? Path extends "" ? "/" : `/${Path}/`
			: TPath;

export type RoutePath<TPath extends string, TParent extends RouteLike | null> = TParent extends RouteLike
	? `${NormalizeParentPath<TParent["~types"]["path"]>}${NormalizedRoutePath<TPath>}`
	: TPath;

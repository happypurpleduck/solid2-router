import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Accessor } from "solid-js";
import type { Route } from "./route.ts";
import type { Router } from "./router.tsx";

export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export interface AnyRoute {
	"path": string;
	"children": AnyRoute[];

	"~types": RouteLikeContext;

	"normalizedPath": string;
}

export interface RouteLikeContext<
	TPath extends string = string,
	TParent extends RouteLike | AnyRouter | null = any,
	TSearch extends {
		in: any;
		out: any;
	} = {
		in: any;
		out: any;
	},
> {
	parent: TParent;
	children: AnyRoute[];

	path: TPath;
	params: PathParams<TPath> & (TParent extends { "~types": { params: infer T } } ? T : unknown);

	search: TSearch;
}

export interface RouteLike {
	"~types": RouteLikeContext;
}

export interface RouteSchema {
	// params?: StandardSchemaV1;
	search?: StandardSchemaV1;
}

export type AnyRouter = Router<AnyRoute[], `/${string}`>;

export interface Location {
	pathname: string;

	search: Record<string, string>;
	hash: string;
}

export type PathParams<TPath extends string>
	= TPath extends `${infer Path}/${infer Rest}`
		? (Path extends `$${infer Name}` ? { [K in Name]: string } : unknown) & PathParams<Rest>
		: TPath extends `$${infer Name}`
			? { [K in Name]: string }
			: unknown;

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

export type RoutePath<TPath extends string, TParent extends RouteLike | null> = string extends TPath
	? TPath
	: TParent extends RouteLike
		? `${NormalizeParentPath<TParent["~types"]["path"]>}${NormalizedRoutePath<TPath>}`
		: TPath;

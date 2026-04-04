import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Component } from "solid-js";
import type { Paths } from "./router.tsx";
import type { AnyRoute, AnyRouter, PathParams, RouteLike, RouteLikeContext, RoutePath, RouteSchema } from "./types.ts";
import { DEV } from "solid-js";
import { Router } from "./router.tsx";

type RouteComponent<T extends RouteLikeContext> = Component<{
	route: {
		// TODO: deep readonly
		params: Readonly<T["params"] extends infer R extends Record<string, string> ? R : Partial<Record<string, string>>>;
		// setParams: (params: T["params"] | ((prev: T["params"]) => T["params"])) => void;
		setParams: (params: T["params"] | ((prev: T["params"]) => T["params"]), opts?: { replace?: true }) => void;
		// TODO: deep readonly
		search: Readonly<T["search"]["out"] extends infer S extends Record<string, any> ? S : Partial<Record<string, string>>>;
		setSearch: (search: T["search"]["in"] | ((prev: T["search"]["out"]) => T["search"]["in"]), opts?: { replace?: true }) => void;
	};
}>;

export class Route<
	const TPath extends string = string,
	const TParent extends RouteLike | AnyRouter | null = any,
	const TSchema extends RouteSchema = RouteSchema,
	const TChildren extends AnyRoute[] = [],
	const T extends RouteLikeContext = {
		parent: TParent;
		path: RoutePath<TPath, TParent>;
		children: TChildren;

		// TODO: should not need to parse parent's again
		params: PathParams<TPath> & (TParent extends infer Parent extends RouteLike ? Parent["~types"]["params"] : unknown);
		search: TSchema extends { search: infer TSearch extends StandardSchemaV1 }
			? {
					in: StandardSchemaV1.InferInput<TSearch>;
					out: StandardSchemaV1.InferOutput<TSearch>;
				} : {
					in: any;
					out: any;
				};
	},
> {
	readonly path: TPath;
	readonly Component?: RouteComponent<T>;
	readonly schema?: TSchema;
	readonly children: TChildren;
	readonly getParent?: () => TParent;
	readonly redirect?: string;

	declare "~types": T;

	constructor({
		path,
		component,
		schema,
		getParent,
		redirect,
	}: {
		path: TPath;
		component?: RouteComponent<T>;
		schema?: TSchema;
		getParent?: () => TParent;

		// TODO: set type to `Paths`
		redirect?: string;
	}) {
		this.path = path;
		this.Component = component;
		this.schema = schema;
		this.getParent = getParent;
		this.redirect = redirect;

		// @ts-expect-error TODO: ???
		this.children = [];
	}

	addChildren<const TTChildren extends ReadonlyArray<AnyRoute>>(children: TTChildren): Route<TPath, TParent, TSchema, [...TChildren, ...TTChildren]> {
		// @ts-expect-error known
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

		let parent: RouteLike | null = this.getParent?.() ?? null;
		while (parent instanceof Route) {
			parent = parent.getParent?.() ?? null;
		}

		if (parent instanceof Router) {
			parent.setDirty(true);
		}

		// @ts-expect-error known
		return this;
	}

	get normalizedPath(): string {
		if (this.path === "" || this.path === "/") {
			return "";
		}

		let path = this.path as string;
		if (path.startsWith("/")) {
			path = path.slice(1);
		}
		if (path.endsWith("/")) {
			path = path.slice(0, -1);
		}

		return path;
	}
}

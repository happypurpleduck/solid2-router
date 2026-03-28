import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Component } from "solid-js";
import type { AnyRoute, PathParams, Prettify, RouteLike, RoutePath, RouteSchema } from "./types.ts";
import { DEV } from "solid-js";

export class Route<
	const TComponent extends Component<any> = Component,
	const TPath extends string = string,
	const TParent extends RouteLike | null = null,
	const TSchema extends RouteSchema = RouteSchema,
	const TChildren extends AnyRoute[] = [],
> implements RouteLike {
	readonly path: TPath;
	readonly Component?: TComponent;
	readonly schema?: TSchema;
	readonly children: TChildren;
	readonly getParent?: () => TParent;

	declare "~types": Prettify<
		& (TSchema extends { search: infer TSearch extends StandardSchemaV1 } ? {
			search: {
				in: StandardSchemaV1.InferInput<TSearch>;
				out: StandardSchemaV1.InferOutput<TSearch>;
			};
		} : unknown)
		& {
			props: TComponent extends Component<infer TProps> ? TProps : never;
			component: TComponent;
			parent: TParent;
			path: RoutePath<TPath, TParent>;
			children: TChildren;

			// TODO should not need to parse parent's again
			params: PathParams<TPath> & (TParent extends RouteLike ? PathParams<TParent["~types"]["path"]> : unknown);
		}
	>;

	constructor({
		path,
		component,
		schema,
		getParent,
	}: {
		path: TPath;
		component: TComponent;
		schema?: TSchema;
		getParent?: () => TParent;
	}) {
		this.path = path;
		this.Component = component;
		this.schema = schema;
		this.getParent = getParent;

		// @ts-expect-error TODO: ???
		this.children = [];
	}

	addChildren<const TTChildren extends ReadonlyArray<AnyRoute>>(children: TTChildren): Route<TComponent, TPath, TParent, TSchema, [...TChildren, ...TTChildren]> {
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

import type { ComponentProps, JSX } from "solid-js";
import type { FlatRoutes, Paths } from "./router.tsx";
import { createMemo } from "solid-js";
import { resolveNavigationPath } from "./navigate.ts";

export function Link<
	const P extends Paths,
	Route extends Extract<FlatRoutes, { "~types": { path: P } }>,
>(props: Omit<ComponentProps<"a">, "href" | "onClick"> & {
	children?: JSX.Element;
	to: P;
	search?: Route["~types"] extends { search: { in: infer S } } ? S : never;
	replace?: true;
}) {
	const path = createMemo(() => resolveNavigationPath(props.to, props.search));

	return (
		<a
			{...props}
			href={path()}
			onClick={(e) => {
				e.preventDefault();

				if (props.replace) {
					window.history.replaceState(null, "", path());
				}
				else {
					window.history.pushState(null, "", path());
				}
			}}
		>
			{props.children}
		</a>
	);
}

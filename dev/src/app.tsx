import { createSignal } from "solid-js";
import * as v from "valibot";
import { Link } from "../../src/link";
import { Outlet } from "../../src/outlet";
import { Route } from "../../src/route";
import { Router } from "../../src/router";

const rootRoute = new Router("/");

const indexRoute = new Route({
	getParent: () => rootRoute,
	path: "/",
	component: function Page1() {
		return <div>Index Page</div>;
	},
});

const postsRoute = new Route({
	getParent: () => rootRoute,
	path: "posts",
	schema: {
		search: v.object({
			page: v.optional(v.number()),
			sort: v.optional(v.string()),
		}),
	},
	component: function Page2() {
		const [count, setCount] = createSignal(0);

		return (
			<div>
				Posts Page
				<button onClick={() => setCount(count() + 1)}>
					{count()}
				</button>
				<Link to="/posts/list">list</Link>
				<Link to="/posts/$postId">id</Link>
				<Outlet />
			</div>
		);
	},
});

// Posts list with search params validation
const postsListRoute = new Route({
	getParent: () => postsRoute,
	path: "/list/",
	// validateSearch: v.object({
	// 	page: v.optional(v.number(), 1),
	// 	sort: v.optional(v.string(), "date"),
	// }),
	component: function Page3() {
		return <div>List Page</div>;
	},
});

const postDetailRoute = new Route({
	getParent: () => postsRoute,
	path: "/$postId/",
	component: function Page4() {
		return <div>Page 4</div>;
	},
});

const aboutRoute = new Route({
	getParent: () => rootRoute,
	path: "about",
	component: function Page4() {
		return <div>Page 4</div>;
	},
});

const routes = rootRoute.addChildren([
	indexRoute,
	postsRoute
		.addChildren([
			postsListRoute,
			postDetailRoute,
		]),
	aboutRoute,
]);

export function App() {
	return (
		<>
			<nav style="display: flex; gap: 1rem; padding: 1rem;">
				<Link to="/">Home</Link>
				<Link to="/posts" search={{}}>Posts</Link>
				<Link to="/about">About</Link>
			</nav>

			<routes.Render />
		</>
	);
}

declare module "../../src/router" {
	export interface R {
		router: typeof routes;
	}
}

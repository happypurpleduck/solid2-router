import { createEffect, createSignal } from "solid-js";
import * as v from "valibot";
import { Link } from "../../src/link";
import { Outlet } from "../../src/outlet";
import { Route } from "../../src/route";
import { Router } from "../../src/router";

export const router = new Router({
	path: "/",
	notFoundComponent: function NotFound() {
		return <h1>Not Found</h1>;
	},
});

const rootRoute = new Route({
	getParent: () => router,
	path: "",
	component: function RootRoute() {
		console.info("root");
		return (
			<>
				<nav style="display: flex; gap: 1rem; padding: 1rem;">
					<Link to="/">Home</Link>
					<Link to="/posts" search={{}}>Posts</Link>
					<Link to="/about">About</Link>
				</nav>

				<Outlet />
			</>
		);
	},
});

export const indexRoute = new Route({
	getParent: () => rootRoute,
	path: "/",
	component: function IndexPage() {
		return <div>Index Page</div>;
	},
});

const aboutRoute = new Route({
	getParent: () => rootRoute,
	path: "about",
	component: function AboutPage() {
		return <div>About Page</div>;
	},
});

const postsRoute = new Route({
	getParent: () => rootRoute,
	path: "posts",
	redirect: "/posts/list",
	component: function PostsPage(props) {
		console.info("posts", props.route.params);
		const [count, _setCount] = createSignal(() => Number.parseInt(props.route.params.postId ?? "") || 0);

		return (
			<div>
				Posts Page

				<button onClick={() => {
					props.route.setParams({ postId: (count() + 1).toString() });
				}}
				>
					{count()}
				</button>
				<div style="display: flex; gap: 1rem; padding: 1rem;">
					<Link to="/posts/list">list</Link>
					<Link
						to="/posts/$postId"
						params={{
							postId: "1",
						}}
					>
						id:1
					</Link>
					<Link
						to="/posts/$postId"
						params={{
							postId: "2",
						}}
					>
						id:2
					</Link>
				</div>
				<Outlet />
			</div>
		);
	},
});

// Posts list with search params validation
const postsListRoute = new Route({
	getParent: () => postsRoute,
	path: "/list/",
	schema: {
		search: v.object({
			page: v.optional(v.number(), 1),
			sort: v.optional(v.string(), "date"),
		}),
	},
	component: function PostsListPage(props) {
		console.info("posts list");

		createEffect(() => props.route.search, console.info);

		return (
			<div>
				List Page
				<button
					onClick={() => {
						props.route.setSearch({ page: 5 });
					}}
				>
					go
				</button>
			</div>
		);
	},
});

const postDetailRoute = new Route({
	getParent: () => postsRoute,
	path: "/$postId/",
	component: function PostDetailPage(props) {
		console.info("post detail", props.route.params.postId);
		createEffect(() => props.route.params.postId, (postId) => {
			console.info("post detail effect", postId);
		});
		return (
			<div>
				Post Detail Page
				{props.route.params.postId}
			</div>
		);
	},
});

export const routes = router.addChildren([
	rootRoute.addChildren([
		indexRoute,
		aboutRoute,
		postsRoute
			.addChildren([
				postsListRoute,
				postDetailRoute,
			]),
	]),
]);

export function App() {
	return <routes.Render />;
}

declare module "../../src/router.tsx" {
	export interface R {
		router: typeof routes;
	}
}

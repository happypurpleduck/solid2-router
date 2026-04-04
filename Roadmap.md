# Roadmap

- [x] Handle Router Path.
- [x] Route Path Parameter handling.
- [ ] Parse Route Search Parameters.
- ~~[ ] Mutable and Reactive Route Path Parameters and Route Search Parameters.~~
	- [x] Set Route Path Parameters.
	- [ ] Set/Validate Route Search Parameters.
- [x] Pass in route parameters and search parameters as props of the route component.
- [ ] Link `Active` state.
- [ ] Route Navigation Guard. `berforeEnter`/`beforeLeave`/etc.
- [ ] Redirect Route, while preserving a "layout" style.
  - Ex. `/posts` is "layout" route.
  but navigating to `/posts` should redirect to `/posts/list`
  because the route has `redirect: "/posts/list"` instead of rendering itself.
- [ ] Scroll Restoration?
- [ ] Per Route Not Found Page?

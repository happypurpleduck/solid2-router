import antfu from "@antfu/eslint-config";

export default antfu({
	stylistic: {
		quotes: "double",
		indent: "tab",
		semi: true,
	},

	rules: {
		"no-console": "off",
		"antfu/no-top-level-await": "off",
	},
});

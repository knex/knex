export default [
	{
		type: "heading",
		size: "lg",
		content: "Upgrading 0.13 -> 0.14",
	},
	{
		type: "text",
		content: [
			"[generic-pool](https://github.com/coopernurse/node-pool) was upgraded to v3. If you have specified `idleTimeoutMillis` or `softIdleTimeoutMillis` in the pool config then you will need to add `evictionRunIntervalMillis: 1000` when upgrading to 0.14.",
			"See original [issue #2322](https://github.com/tgriesser/knex/issues/2322) for details."
		]
	},
]

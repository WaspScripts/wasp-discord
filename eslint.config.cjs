const { defineConfig, globalIgnores } = require("eslint/config")

const tsParser = require("@typescript-eslint/parser")
const typescriptEslint = require("@typescript-eslint/eslint-plugin")
const globals = require("globals")
const js = require("@eslint/js")

const { FlatCompat } = require("@eslint/eslintrc")

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
})

module.exports = defineConfig([
	{
		languageOptions: {
			parser: tsParser,
			ecmaVersion: "latest",
			sourceType: "module",
			parserOptions: {},

			globals: {
				...Object.fromEntries(Object.entries(globals.browser).map(([key]) => [key, "off"])),
				...globals.node
			}
		},

		extends: compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"),

		plugins: {
			"@typescript-eslint": typescriptEslint
		}
	},
	globalIgnores(["**/*.cjs"]),
	globalIgnores([
		"**/.DS_Store",
		"**/node_modules",
		"build",
		"package",
		"**/.env",
		"**/.env.*",
		"!**/.env.example",
		"**/pnpm-lock.yaml",
		"**/package-lock.json",
		"**/yarn.lock"
	])
])

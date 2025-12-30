declare global {
	namespace NodeJS {
		interface ProcessEnv {
			SUPABASE_URL: string
			SUPABASE_ANON_KEY: string
			DISCORD_TOKEN: string
			GUILD_ID: string
			ENVIRONMENT: "development" | "production"
		}
	}
}

export {}

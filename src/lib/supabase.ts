import { createClient } from "@supabase/supabase-js"
import type { Database } from "$lib/types/supabase"

export const supabase = createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
	auth: { persistSession: false }
})

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function getWSID(user: string) {
	if (UUID_REGEX.test(user)) return user

	const { data, error } = await supabase
		.schema("profiles")
		.from("profiles")
		.select("id")
		.eq("discord", user)
		.limit(1)
		.maybeSingle()

	if (error) {
		console.error(error)
		return null
	}

	if (data == null) return null

	return data.id
}

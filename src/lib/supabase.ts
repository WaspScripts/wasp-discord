import { createClient } from "@supabase/supabase-js"
import type { Database } from "$lib/types/supabase"
import { ClientEx, type DBRole } from "./client"
import { fetchMember } from "./utils"

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

export const pendingRoleWrites = new Map<string, DBRole | null>()

export function getDatabaseListener(client: ClientEx) {
	return supabase
		.channel("profiles-role-changes-listener")
		.on("postgres_changes", { event: "UPDATE", schema: "profiles", table: "profiles" }, async (payload) => {
			const { discord, role } = payload.new
			if (pendingRoleWrites.has(discord) && pendingRoleWrites.get(discord) === role) {
				pendingRoleWrites.delete(discord)
				return
			}

			const guildRole = client.roles[role as DBRole]
			if (!guildRole) return

			const member = await fetchMember(client.guild, discord)
			if (!member || member.roles.cache.has(guildRole.id)) return

			console.log("Adding role: ", guildRole.name, " to user: ", member.displayName, " id: ", member.id)
			await member.roles.add(guildRole).catch(console.error)
		})
		.subscribe()
}

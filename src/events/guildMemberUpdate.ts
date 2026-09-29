import { CLIENT_ROLES, ClientEvent, type DBRole } from "$lib/client"
import { getWSID, pendingRoleWrites, supabase } from "$lib/supabase"
import { Collection, Events, Role } from "discord.js"

const ROLE_ORDER = [
	"premium",
	"contributor",
	"tester",
	"scripter",
	"moderator",
	"administrator"
] satisfies readonly DBRole[]

function mapRoles(roles: Collection<string, Role>) {
	const result: Map<string, DBRole> = new Collection()

	let previous = ROLE_ORDER[0]
	roles.forEach((role) => {
		const name = role.name.toLowerCase() as DBRole
		if (ROLE_ORDER.includes(name)) previous = name
		if (CLIENT_ROLES.includes(previous)) {
			result.set(name, previous)
		}
	})
	return result
}

export default new ClientEvent(Events.GuildMemberUpdate, async (_client, old, member) => {
	const { guild } = member
	if (guild.id !== process.env.GUILD_ID) return
	if (!old.partial && old.roles.highest.id === member.roles.highest.id) return

	const role = member.roles.highest.name.toLowerCase()
	let mapped: DBRole | null = null

	if (role !== "@everyone") {
		const roles = mapRoles(
			guild.roles.cache
				.filter((r) => r.name !== "@everyone" && !r.managed)
				.sort((a, b) => a.position - b.position)
		)

		const found = roles.get(role)
		if (!found) return //role too low/high for waspbot to manage. AKA, database is the one that can set/remove it
		mapped = found
	}

	const wsid = await getWSID(member.id)
	if (!wsid) return

	pendingRoleWrites.set(member.id, mapped)
	const { error } = await supabase.schema("profiles").from("profiles").update({ role: mapped }).eq("id", wsid)
	if (error) {
		pendingRoleWrites.delete(member.id)
		console.error(error)
	}
})

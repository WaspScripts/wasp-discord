import { CLIENT_ROLES, ClientEvent, type DBRole } from "$lib/client"
import { getDatabaseListener, getWSID, supabase } from "$lib/supabase"
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

export default new ClientEvent(Events.GuildMemberUpdate, async (client, _old, member) => {
	const { guild } = member
	if (guild.id !== process.env.GUILD_ID) return

	const wsidPromise = getWSID(member.id)

	const role = member.roles.highest.name.toLowerCase()

	if (role == "@everyone") {
		const wsid = await wsidPromise
		if (!wsid) return

		await client.dbListener.unsubscribe()
		await supabase.schema("profiles").from("profiles").update({ role: null }).eq("id", wsid)
		client.dbListener = getDatabaseListener(client)
	}

	const roles = mapRoles(
		guild.roles.cache
			.filter((r) => r.name !== "@everyone" && !r.managed)
			.sort((a, b) => a.position - b.position)
	)

	const mapped = roles.get(role)
	if (!mapped) return //role too low/high for waspbot to manage. AKA, database is the one that can set/remove it

	const wsid = await wsidPromise
	if (!wsid) return

	await client.dbListener.unsubscribe()
	await supabase.schema("profiles").from("profiles").update({ role: mapped }).eq("id", wsid)
	client.dbListener = getDatabaseListener(client)
})

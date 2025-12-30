import type { Guild, GuildMember, GuildTextBasedChannel } from "discord.js"

export function getGuildChannel(guild: Guild, channel: string) {
	const lowered = channel.toLowerCase()
	const result = guild.channels.cache.find(
		(ch) => !ch.isDMBased() && ch.isTextBased() && ch.name.toLowerCase().includes(lowered)
	)
	if (!result) throw new Error(channel + " channel does not exist!")
	return result as GuildTextBasedChannel
}

export async function getGuildRole(guild: Guild, role: string) {
	const lowered = role.toLowerCase()
	const result = guild.roles.cache.find((r) => r.name.toLowerCase().includes(lowered))
	if (!result) throw new Error(role + " role does not exist!")
	return result
}

export function getRole(member: GuildMember, roles: string[]) {
	return member.roles.cache.find((role) => roles.includes(role.name.toLowerCase()))
}

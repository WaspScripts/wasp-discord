import { Events } from "discord.js"
import { ClientEvent } from "$lib/client"
import { getRole } from "$lib/utils"

const maxTime = 2 * 24 * 60 * 60 * 1000 //48H

export default new ClientEvent(Events.MessageUpdate, async (client, oldMsg, newMsg) => {
	const { guild } = newMsg
	if (guild !== client.guild) return
	if (newMsg.author.bot) return

	const management = client.channelsMap["management"]
	if (!management) return
	const mod = client.roles["moderator"]
	if (!mod) return

	const ageMs = (newMsg.editedTimestamp ?? 0) - oldMsg.createdTimestamp

	if (ageMs <= maxTime) return

	const { member } = newMsg
	if (!member) return

	const role = getRole(member, ["administrator", "moderator", "scripter", "tester"])
	if (role) return

	await management
		.send(
			"<@" +
				mod.id +
				"> <@" +
				newMsg.author.id +
				"> edited a message that is more than 48H old: https://discord.com/channels/" +
				newMsg.guildId +
				"/" +
				newMsg.channelId +
				"/" +
				newMsg.id
		)
		.catch((e) => console.error(e))
})

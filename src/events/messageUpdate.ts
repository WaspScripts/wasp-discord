import { Events } from "discord.js"
import { ClientEvent } from "$lib/client"

const hour = 30 * 60 * 1000

export default new ClientEvent(Events.MessageUpdate, async (client, oldMsg, newMsg) => {
	const { guild } = newMsg
	if (guild !== client.guild) return
	if (newMsg.author.bot) return

	const ageMs = (newMsg.editedTimestamp ?? 0) - oldMsg.createdTimestamp

	if (ageMs > hour) {
		const reply = await newMsg
			.reply(
				"<@" +
					newMsg.author.id +
					"> your message has been deleted.\n\nFor server safety reasons, you can't edit messages that are older than 30 minutes on this server."
			)
			.catch((e) => console.error(e))
		await newMsg.delete().catch((e) => console.error(e))

		if (reply) setTimeout(async () => await reply.delete(), 15000)
	}
})

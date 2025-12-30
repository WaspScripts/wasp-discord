import type { Command } from "$lib/client"
import { MessageFlags } from "discord.js"

const command: Command = {
	name: "clear",
	roles: ["administrator", "moderator"],
	description: "Clears the last 100 messages from the channel",
	run: async ({ interaction }) => {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral })
		const channel = interaction.channel
		if (!channel) return await interaction.followUp("Can't find channel!")
		if (channel.isDMBased()) return await interaction.followUp("Only messages on a guild can be cleared!")

		const messages = await channel.messages.fetch({ limit: 100 })

		if (messages.size > 0) {
			await channel.bulkDelete(messages)
			return await interaction.followUp("Last 100 messages were deleted!")
		}

		return await interaction.followUp("No messages to delete found.")
	}
}

export default command

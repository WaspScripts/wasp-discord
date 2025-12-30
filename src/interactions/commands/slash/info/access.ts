import type { Command } from "$lib/client"
import { getFreeAccess, getSubscriptions } from "$lib/commands"
import { getWSID } from "$lib/supabase"
import { ApplicationIntegrationType, MessageFlags, type InteractionReplyOptions } from "discord.js"

const command: Command = {
	name: "access",
	roles: ["administrator", "moderator", "scripter", "tester"],
	description: "Gets the user subscriptions and free access information",
	integrationTypes: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	options: [{ type: 6, name: "user", description: "Discord user", required: true }],
	run: async ({ interaction, args }) => {
		const user = args.data[0].value as string
		if (user == "") {
			return await interaction.followUp({
				content: "Can't find interaction target.",
				flags: MessageFlags.Ephemeral
			})
		}

		const wsid = await getWSID(user)
		if (!wsid)
			return interaction.followUp({ content: "Can't find user WSID.", flags: MessageFlags.Ephemeral })

		const [subs, free] = await Promise.all([
			getSubscriptions(interaction.member, wsid, 0),
			getFreeAccess(wsid, 0)
		])
		await interaction.followUp(subs as InteractionReplyOptions)
		await interaction.followUp(free as InteractionReplyOptions)
	}
}

export default command

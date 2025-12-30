import type { Command } from "$lib/client"
import { getFreeAccess, getSubscriptions } from "$lib/commands"
import { getWSID } from "$lib/supabase"
import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
	type InteractionReplyOptions
} from "discord.js"

const command: Command = {
	name: "WaspScripts Access",
	roles: ["administrator", "moderator", "scripter", "tester"],
	type: ApplicationCommandType.User,
	integrationTypes: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [
		InteractionContextType.Guild,
		InteractionContextType.BotDM,
		InteractionContextType.PrivateChannel
	],
	run: async ({ interaction }) => {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral })
		if (!interaction.isUserContextMenuCommand()) {
			return await interaction.followUp({
				content: "Can't find interaction target.",
				flags: MessageFlags.Ephemeral
			})
		}

		const wsid = await getWSID(interaction.targetId)
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

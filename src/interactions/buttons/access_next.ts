import type { Button } from "$lib/client"
import { getFreeAccess } from "$lib/commands"
import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
	type InteractionUpdateOptions
} from "discord.js"

const modal: Button = {
	name: "access_next",
	description: "Access next button",
	roles: ["administrator", "moderator", "scripter", "tester"],
	type: ApplicationCommandType.ChatInput,
	integrationTypes: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [
		InteractionContextType.Guild,
		InteractionContextType.BotDM,
		InteractionContextType.PrivateChannel
	],
	run: async ({ interaction }) => {
		const { content } = interaction.message
		const wsidMatch = content.match(/^## WSID: ([\w-]+)/m)
		const wsid = wsidMatch ? wsidMatch[1] : null
		if (!wsid) return await interaction.update("Can't find user WSID.")

		const pageMatch = content.match(/^### Page: (\d+)/m)
		const page = pageMatch ? parseInt(pageMatch[1]) : 1

		const msg = await getFreeAccess(wsid, page)
		return await interaction.update(msg as InteractionUpdateOptions)
	}
}

export default modal

import { wsid } from "$lib/commands"
import type { Command } from "$lib/client"
import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType } from "discord.js"

const command: Command = {
	name: "WaspScripts ID",
	type: ApplicationCommandType.User,
	integrationTypes: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [
		InteractionContextType.Guild,
		InteractionContextType.BotDM,
		InteractionContextType.PrivateChannel
	],
	run: async ({ interaction, args }) => await wsid(interaction, args.data[0].value as string)
}

export default command

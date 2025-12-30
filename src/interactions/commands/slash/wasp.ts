import type { Command } from "$lib/client"
import { ApplicationIntegrationType, InteractionContextType } from "discord.js"

const command: Command = {
	name: "wasp",
	description: 'Replies with resources from https://waspscripts.com"',
	integrationTypes: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [
		InteractionContextType.Guild,
		InteractionContextType.BotDM,
		InteractionContextType.PrivateChannel
	],
	options: [
		{
			type: 3,
			name: "page",
			description: "Page",
			choices: [
				{ name: "Setup", value: "/setup" },
				{ name: "Manual setup", value: "/tutorials/setup-windows-by-torwent" },
				{ name: "Scripts", value: "/scripts" },
				{ name: "Premium", value: "/premium" },
				{ name: "FAQ", value: "/information/faqs" },
				{ name: "Common Error", value: "/information/errors" },
				{ name: "Tutorials", value: "/tutorials" }
			]
		},
		{ type: 3, name: "script", description: "Search a script" },
		{ type: 3, name: "faq", description: "Search a FAQ" },
		{ type: 3, name: "error", description: "Search a common error" },
		{ type: 3, name: "tutorials", description: "Search a tutorial" },
		{ type: 3, name: "stats", description: "Search a stats user" },
		{ type: 3, name: "scripters", description: "Search a scripter" },
		{ type: 6, name: "user", description: "user to ping", required: false }
	],

	run: async ({ interaction, args }) => {
		await interaction.deferReply()
		let link = "https://waspscripts.dev"
		if (args.data.length > 0) {
			args.data.forEach((entry) => {
				if (entry.name === "user") link = "<@" + entry.value + "> Check: " + link
				if (entry.name === "page") link += encodeURI(entry.value as string)
				if (entry.name === "script") link += "/scripts?search=" + encodeURI(entry.value as string)
				if (entry.name === "faq") link += "/information/faqs?search=" + encodeURI(entry.value as string)
				if (entry.name === "error") link += "/information/error?search=" + encodeURI(entry.value as string)
				if (entry.name === "tutorials") link += "/tutorials?search=" + encodeURI(entry.value as string)
				if (entry.name === "stats") link += "/stats?search=" + encodeURI(entry.value as string)
				if (entry.name === "scripters") link += "/devs?search=" + encodeURI(entry.value as string)
			})
		}

		return await interaction.followUp(link)
	}
}

export default command

import { supabase } from "$lib/supabase"
import type { Command } from "$lib/client"
import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, Role } from "discord.js"

interface Profile {
	id: string
	stripe: string
	private: { email: string }
	role: Role
}

const command: Command = {
	name: "User information",
	roles: ["administrator", "moderator", "scripter"],
	type: ApplicationCommandType.User,
	integrationTypes: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [
		InteractionContextType.Guild,
		InteractionContextType.BotDM,
		InteractionContextType.PrivateChannel
	],
	run: async ({ interaction, args }) => {
		await interaction.deferReply({ ephemeral: true })
		const roles = interaction.member.roles.cache
		const user = args.data[0].value as string

		if (user === "") {
			await interaction.editReply("Discord ID is empty.")
			return
		}

		const { data, error } = await supabase
			.schema("profiles")
			.from("profiles")
			.select("id, stripe, private!left (email), role")
			.eq("discord", user)
			.single<Profile>()

		if (error) {
			await interaction.editReply("Database error: \n```\n" + JSON.stringify(error) + "```")
			return
		}

		const isAdmin = roles.find((r) => r.name.toLowerCase() === "administrator")

		let message = ""
		if (isAdmin)
			message +=
				"Client Link: <https://dashboard.stripe.com/acct_1RerVIG22w4J2Ay5/customers/" + data.stripe + ">\n"
		message += "```\n"
		message += "Wasp ID   : " + data.id + "\n"
		message += "Discord ID: " + user + "\n"
		message += "Stripe ID : " + data.stripe + "\n"

		if (isAdmin) message += "Email     : " + data.private.email + "\n"

		message += "Role      : " + data.role + "\n"
		message += "```"

		await interaction.editReply(message)
	}
}

export default command

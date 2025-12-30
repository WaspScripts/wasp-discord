import type { Command } from "$lib/client"
import { ApplicationIntegrationType, EmbedBuilder, type APIEmbedField, type RestOrArray } from "discord.js"

const command: Command = {
	name: "server",
	roles: ["administrator", "moderator"],
	description: "Replies with server info",
	integrationTypes: [ApplicationIntegrationType.GuildInstall],
	run: async ({ interaction }) => {
		await interaction.deferReply()

		const guild = interaction.guild
		if (!guild) {
			interaction.followUp("This can only be used in a guild")
			return
		}

		const totalUsers = interaction.guild.memberCount
		const rolesCache = interaction.guild.roles.cache

		const roles: RestOrArray<APIEmbedField> = []
		let otherCount = totalUsers
		rolesCache.forEach((role) => {
			if (!role.managed) {
				const count = role.members.size
				roles.push({ name: role.name, value: `${count}`, inline: true })
				otherCount -= count
			}
		})

		const embed = new EmbedBuilder()
			.setColor(0xffa200)
			.setTitle("waspscripts.dev")
			.setURL("https://waspscripts.dev")
			.setDescription("Information about waspscripts.dev Discord server")
			.setThumbnail("https://waspscripts.dev/cover.jpg")
			.addFields({ name: "Total users", value: `${totalUsers}` }, ...roles, {
				name: "Other",
				value: `${otherCount}`,
				inline: true
			})

		interaction.followUp({ embeds: [embed] })
	}
}

export default command

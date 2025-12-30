import { CommandInteractionOptionResolver, Events, MessageFlags } from "discord.js"
import { getRole } from "$lib/utils"
import {
	ClientEvent,
	type ButtonInteractionEx,
	type CommandInteractionEx,
	type ModalSubmitInteractionEx
} from "$lib/client"

export default new ClientEvent(Events.InteractionCreate, async (client, interaction) => {
	const timestamp = "[" + new Date(interaction.createdTimestamp) + "]: "
	const interactionStr = "Interaction: " + interaction.id
	const channelStr = "Channel: " + interaction.channelId
	const caller = interaction.user.id
	const userStr = "User: " + interaction.user.displayName + ", User ID:" + caller
	const guildStr = "Guild: " + interaction.guild?.name + ", Guild ID: " + interaction.guildId
	console.log(timestamp, interactionStr, ", ", channelStr, ", ", userStr, ", ", guildStr)

	if (interaction.isButton()) {
		const button = client.buttons.get(interaction.customId)
		if (!button)
			return interaction.reply({ content: "That button does not exist!", flags: MessageFlags.Ephemeral })

		const member = client.guild.members.cache.get(caller)
		if (!member) {
			return interaction.reply({
				content: "Only members of waspscripts.dev server can use this command.",
				flags: MessageFlags.Ephemeral
			})
		}

		if (button.roles && button.roles.length > 0) {
			const role = getRole(member, button.roles)
			if (!role) {
				return interaction.reply({
					content: "Only " + button.roles.join("/") + " roles in waspscripts.dev can use this command.",
					flags: MessageFlags.Ephemeral
				})
			}
		}

		try {
			button.run({
				client,
				member,
				interaction: interaction as ButtonInteractionEx
			})
		} catch (error) {
			console.error("Interaction failed: " + interaction.customId + " error: " + error)
		}
	}

	if (interaction.isModalSubmit()) {
		const modal = client.modals.get(interaction.customId)
		if (!modal) {
			return interaction.reply({ content: "That modal does not exist!", flags: MessageFlags.Ephemeral })
		}

		const member = client.guild.members.cache.get(caller)
		if (!member) {
			return interaction.reply({
				content: "Only members of waspscripts.dev server can use this command.",
				flags: MessageFlags.Ephemeral
			})
		}

		if (modal.roles && modal.roles.length > 0) {
			const role = getRole(member, modal.roles)
			if (!role) {
				return interaction.reply({
					content: "Only " + modal.roles.join("/") + " roles in waspscripts.dev can use this command.",
					flags: MessageFlags.Ephemeral
				})
			}
		}

		try {
			modal.run({
				client,
				member,
				interaction: interaction as ModalSubmitInteractionEx,
				data: interaction.components
			})
		} catch (error) {
			console.error("Interaction failed: " + interaction.customId + " error: " + error)
		}
	}

	if (
		!interaction.isChatInputCommand() &&
		!interaction.isUserContextMenuCommand() &&
		!interaction.isMessageContextMenuCommand()
	)
		return

	const command = client.commands.get(interaction.commandName)
	if (!command) {
		return interaction.reply({ content: "That command does not exist!", flags: MessageFlags.Ephemeral })
	}

	const { roles } = command

	if (roles && roles.length > 0) {
		const member = client.guild.members.cache.get(caller)
		if (!member) {
			return interaction.reply({
				content: "Only " + roles.join("/") + " roles in waspscripts.dev can use this command.",
				flags: MessageFlags.Ephemeral
			})
		}

		const role = getRole(member, roles)
		if (!role) {
			return interaction.reply({
				content: "Only " + roles.join("/") + " roles in waspscripts.dev can use this command.",
				flags: MessageFlags.Ephemeral
			})
		}
	}

	try {
		command.run({
			client,
			caller,
			interaction: interaction as CommandInteractionEx,
			args: interaction.options as CommandInteractionOptionResolver
		})
	} catch (error) {
		console.error("Interaction failed: " + interaction.commandName + " error: " + error)
	}
})

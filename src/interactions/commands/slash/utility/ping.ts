import type { Command } from "$lib/client"
import { MessageFlags } from "discord.js"

const command: Command = {
	name: "ping",
	description: "Replies with Pong!",
	roles: ["administrator", "moderator", "scripter", "tester", "contributor"],
	run: async ({ interaction }) => interaction.reply({ content: "Pong!", flags: MessageFlags.Ephemeral })
}

export default command

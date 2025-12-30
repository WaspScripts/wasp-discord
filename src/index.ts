import { ClientEx } from "$lib/client"
import { GatewayIntentBits } from "discord.js"

export const client = new ClientEx({
	intents: [
		GatewayIntentBits.Guilds
		//, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageTyping
	]
})

client.start()

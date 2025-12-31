import { ClientEx } from "$lib/client"
import { GatewayIntentBits, Partials } from "discord.js"

export const client = new ClientEx({
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildIntegrations,
		GatewayIntentBits.DirectMessagePolls,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.DirectMessageTyping,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.MessageContent,
		32767
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember]
})

client.start()

import { ClientEx } from "$lib/client"
import { GatewayIntentBits, Options, Partials } from "discord.js"

export const client = new ClientEx({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	],
	partials: [Partials.Message, Partials.User, Partials.GuildMember],
	makeCache: Options.cacheWithLimits({
		...Options.DefaultMakeCacheSettings,
		MessageManager: 0,
		ReactionManager: 0,
		PresenceManager: 0,
		VoiceStateManager: 0,
		GuildInviteManager: 0,
		GuildStickerManager: 0,
		GuildEmojiManager: 0
	})
})

client.start()

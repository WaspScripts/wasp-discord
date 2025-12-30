import { MessageType, TextChannel } from "discord.js"
import { ClientEvent } from "$lib/client"

export default new ClientEvent("messageCreate", async (client, message) => {
	const { guild } = message
	if (guild !== client.guild) return
	if (message.author.bot) return

	if (message.attachments.size > 0) {
		for (const attachment of message.attachments.values()) {
			const contentType = attachment.contentType || attachment.name

			if (contentType.startsWith("audio") || /\.(mp3|wav|ogg|flac)$/i.test(contentType)) {
				let msg = "<@" + message.author.id + "> your message has been deleted.\n\n"
				msg +=
					"The file type `" +
					contentType +
					"` is not allowed on this server. If this seems like a mistake contact a moderator and let them know 😄\n\n"
				msg += "This message will self-destruct in **15** seconds."
				const reply = await message.reply(msg)
				await message.delete()

				setTimeout(async () => await reply.delete(), 15000)
				return
			}

			if (message.channel !== client.channelsMap.achievements) continue

			if (
				(!contentType.startsWith("image") && !contentType.startsWith("video")) ||
				contentType === "image/gif"
			) {
				let msg = "<@" + message.author.id + "> your message has been deleted.\n\n"
				msg +=
					"The file type `" +
					contentType +
					"` is not allowed on this channel. If this seems like a mistake contact a moderator and let them know 😄\n\n"
				msg += "This message will self-destruct in **15** seconds."
				const reply = await message.reply(msg)
				await message.delete()

				setTimeout(async () => await reply.delete(), 15000)
				return
			}
		}
	}

	if (message.channel === client.channelsMap.achievements) {
		if (message.channel.isThread()) return
		const channel = message.channel as TextChannel

		if (message.attachments.size === 0) {
			let msg = "<@" + message.author.id + "> your message has been deleted.\n\n"
			msg += "This is a media only server, please post a picture of your achievement 😄\n\n"
			msg += "This message will self-destruct in **15** seconds."
			const reply = await message.reply(msg)
			await message.delete()

			setTimeout(async () => await reply.delete(), 15000)
			return
		}

		if (message.type === MessageType.Reply) {
			let msg = "<@" + message.author.id + "> your message has been deleted.\n\n"
			msg += "Please keep conversations within threads.\n\n"
			msg += "This message will self-destruct in **30** seconds."

			const reply = await message.reply(msg)
			await message.delete()
			setTimeout(async () => await reply.delete(), 30000)
			return
		}

		const thread = await message.startThread({ name: "Achievement #" + (channel.threads.cache.size + 1) })
		await thread.send(":tada:")
	}

	if (message.channel === client.channelsMap.bans) {
		if (message.channel.isThread()) return

		const channel = message.channel as TextChannel

		if (message.type === MessageType.Reply) {
			let msg = "<@" + message.author.id + "> your message has been deleted.\n\n"
			msg += "Please keep conversations within threads.\n\n"
			msg += "If you want to post a new ban please try to stick to the official format:\n\n"
			msg += "```\n"
			msg += "WaspScripts (last 3 weeks):\n"
			msg += "Other bots (last 3 weeks):\n\n"
			msg += "Used a VPN/Proxy:\n"
			msg += "Account age:\n"
			msg += "Suicide bot:\n"
			msg += "Breaks:\n"
			msg += "Sleeps:\n"
			msg += "Daily botting time:\n\n"
			msg += "RWT:\n"
			msg += "Accounts on the same IP:\n"
			msg += "Previous bans:\n"
			msg += "Ban type:\n"
			msg += "```\n\n"
			msg += "This message will self-destruct in **30** seconds."

			const reply = await message.reply(msg)
			await message.delete()
			setTimeout(async () => await reply.delete(), 30000)
			return
		}

		const thread = await message.startThread({ name: "Ban #" + (channel.threads.cache.size + 1) })
		let msg =
			"Please take posts on this channel with a grain of salt as anyone can post here with no requirements whatsoever "
		msg +=
			" and try to not attack anyone just because you don't believe them or simply don't agree with them."
		await thread.send(msg)
	}
})

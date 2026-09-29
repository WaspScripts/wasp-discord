import { ClientEvent } from "$lib/client"
import { Events, ForumChannel } from "discord.js"

export default new ClientEvent(Events.ThreadUpdate, async (client, oldThread, thread) => {
	if (thread.guild !== client.guild) return
	const parent = thread.parent as ForumChannel
	if (parent.name !== "👋help") return

	const solved = parent.availableTags.find((tag) => tag.name === "solved")!

	const newTags = thread.appliedTags.find((tag) => !oldThread.appliedTags.includes(tag))

	if (newTags !== solved.id) return

	await thread.edit({ appliedTags: [solved.id], locked: true, archived: true })
})

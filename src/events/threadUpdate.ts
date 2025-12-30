import { ClientEvent } from "$lib/client"
import { ForumChannel } from "discord.js"

export default new ClientEvent("threadUpdate", async (client, thread) => {
	if (thread.guild !== client.guild) return
	const parent = thread.parent as ForumChannel
	if (parent.name !== "🙋help") return

	const solved = parent.availableTags.find((tag) => tag.name === "solved")!

	const updatedThread = parent.threads.cache.get(thread.id)
	if (!updatedThread) return
	const newTags = updatedThread.appliedTags.find((tag) => !thread.appliedTags.includes(tag))

	if (newTags !== solved.id) return

	await thread.setAppliedTags([solved.id])
	await thread.setLocked(true)
	await thread.setArchived(true)
})

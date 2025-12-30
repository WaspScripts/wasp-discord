import { ClientEvent } from "$lib/client"
import { ForumChannel } from "discord.js"

export default new ClientEvent("threadCreate", async (client, thread) => {
	if (thread.guild !== client.guild) return
	const parent = thread.parent as ForumChannel
	if (parent.name !== "👋help") return

	const suggestion = parent.availableTags.find((tag) => tag.name === "suggestion")
	if (!suggestion) return

	if (thread.appliedTags.includes(suggestion.id)) return

	const unsolved = parent.availableTags.find((tag) => tag.name === "unsolved")
	if (!unsolved) return

	await thread.setAppliedTags([...thread.appliedTags, unsolved.id])
})

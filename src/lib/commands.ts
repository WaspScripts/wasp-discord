import { getWSID, supabase } from "$lib/supabase"
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Collection,
	GuildMember,
	MessageFlags,
	type MessageActionRowComponentBuilder
} from "discord.js"
import type { CommandInteractionEx } from "$lib/client"
import { getRole } from "./utils"

type ProductCacheEntry = {
	name: string
	cachedAt: number
}

const CACHE_TTL = 60 * 60 * 1000

const productsMap: Map<string, ProductCacheEntry> = new Collection()

function getProductName(id: string) {
	const entry = productsMap.get(id)
	if (!entry) return null

	if (Date.now() - entry.cachedAt > CACHE_TTL) {
		productsMap.delete(id)
		return null
	}

	return entry.name
}

function setProductName(id: string, name: string) {
	productsMap.set(id, {
		name,
		cachedAt: Date.now()
	})
}

const amount = 10

export async function getSubscriptions(member: GuildMember, wsid: string, page: number) {
	let message = "# Subscriptions\n"

	const { data, error, count } = await supabase
		.schema("profiles")
		.from("subscriptions")
		.select("id, product, date_start, date_end, cancel", { count: "exact" })
		.eq("user_id", wsid)
		.order("date_end", { ascending: false })
		.range(page * amount, page * amount + amount - 1)

	if (error) {
		return {
			content: "Database error:\n```json\n" + JSON.stringify(error) + "\n```",
			flags: MessageFlags.Ephemeral
		}
	}

	const products = []
	const missing = new Map<string, typeof data>()

	for (const entry of data) {
		const name = getProductName(entry.product)

		if (name) {
			products.push({ ...entry, name })
			continue
		}

		if (!missing.has(entry.product)) missing.set(entry.product, [])
		missing.get(entry.product)!.push(entry)
	}

	if (missing.size > 0) {
		const { data, error } = await supabase
			.schema("stripe")
			.from("products")
			.select("id, name")
			.in("id", [...missing.keys()])

		if (error) {
			return {
				content: "Database error:\n```json\n" + JSON.stringify(error) + "\n```",
				flags: MessageFlags.Ephemeral
			}
		}

		for (const row of data) {
			setProductName(row.id, row.name)
		}

		for (const [productId, entries] of missing.entries()) {
			const name = getProductName(productId)
			if (!name)
				return { content: "Failed to get product name for: " + productId, flags: MessageFlags.Ephemeral }

			for (const entry of entries) {
				products.push({ ...entry, name })
			}
		}
	}

	message += `## WSID: ${wsid}\n`
	message += `### Total: ${count ?? 0}\n`
	message += `### Page: ${page + 1}\n\n`

	message += "```\n"

	const now = new Date()
	for (const entry of products) {
		const dateEnd = new Date(entry.date_end)
		message += entry.product + " " + entry.id
		message += " From " + new Date(entry.date_start).toLocaleDateString("PT-pt")
		message += " To " + dateEnd.toLocaleDateString("PT-pt")
		if (now > dateEnd) {
			message += " TERMINATED "
		} else {
			if (entry.cancel !== undefined) message += " Cancel " + entry.cancel
		}
		message += " > " + entry.name
		message += "\n"
	}
	message += "```\n"

	if (getRole(member, ["administrator"])) {
		for (const entry of products) {
			message += `> ${(entry.name + ":").padEnd(16, " ")} <https://dashboard.stripe.com/acct_1RerVIG22w4J2Ay5/subscriptions/${entry.id}>\n`
		}
	}

	const previous = new ButtonBuilder()
		.setCustomId("subscriptions_previous")
		.setLabel("Previous")
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(page < 1)

	const next = new ButtonBuilder()
		.setCustomId("subscriptions_next")
		.setLabel("Next")
		.setStyle(ButtonStyle.Secondary)
		.setDisabled((page + 1) * 5 >= (count ?? 0))

	const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(previous, next)

	return { content: message, components: [row], flags: MessageFlags.Ephemeral }
}

export async function getFreeAccess(wsid: string, page: number) {
	let message = "# Free Access\n"

	console.log("page: ", page, ", amount: ", amount)
	console.log("from: ", page * amount, " to: ", page * amount + amount - 1)
	const { data, error, count } = await supabase
		.schema("profiles")
		.from("free_access")
		.select("id, product, date_start, date_end", { count: "exact" })
		.eq("user_id", wsid)
		.order("date_end", { ascending: false })
		.range(page * amount, page * amount + amount - 1)

	if (error) {
		return {
			content: "Database error:\n```json\n" + JSON.stringify(error) + "\n```",
			flags: MessageFlags.Ephemeral
		}
	}

	const products = []
	const missing = new Map<string, typeof data>()

	for (const entry of data) {
		const name = getProductName(entry.product)

		if (name) {
			products.push({ ...entry, name })
			continue
		}

		if (!missing.has(entry.product)) missing.set(entry.product, [])
		missing.get(entry.product)!.push(entry)
	}

	if (missing.size > 0) {
		const { data, error } = await supabase
			.schema("stripe")
			.from("products")
			.select("id, name")
			.in("id", [...missing.keys()])

		if (error) {
			return {
				content: "Database error:\n```json\n" + JSON.stringify(error) + "\n```",
				flags: MessageFlags.Ephemeral
			}
		}

		for (const row of data) {
			setProductName(row.id, row.name)
		}

		for (const [productId, entries] of missing.entries()) {
			const name = getProductName(productId)
			if (!name)
				return { content: "Failed to get product name for: " + productId, flags: MessageFlags.Ephemeral }

			for (const entry of entries) {
				products.push({ ...entry, name })
			}
		}
	}

	message += `## WSID: ${wsid}\n`
	message += `### Total: ${count ?? 0}\n`
	message += `### Page: ${page + 1}\n\n`

	message += "```\n"

	const now = new Date()
	for (const entry of products) {
		const dateEnd = new Date(entry.date_end)
		message += entry.product + " " + entry.id
		message += " From " + new Date(entry.date_start).toLocaleDateString("PT-pt")
		message += " To " + dateEnd.toLocaleDateString("PT-pt")
		if (now > dateEnd) {
			message += " TERMINATED "
		}
		message += " > " + entry.name
		message += "\n"
	}
	message += "```\n"

	const previous = new ButtonBuilder()
		.setCustomId("access_previous")
		.setLabel("Previous")
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(page < 1)

	console.log("count: ", count)
	const next = new ButtonBuilder()
		.setCustomId("access_next")
		.setLabel("Next")
		.setStyle(ButtonStyle.Secondary)
		.setDisabled((page + 1) * amount >= (count ?? 0))

	const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(previous, next)

	return { content: message, components: [row], flags: MessageFlags.Ephemeral }
}

export async function wsid(interaction: CommandInteractionEx, user: string) {
	const deferred = interaction.deferReply({ flags: MessageFlags.Ephemeral })

	if (user === "") {
		await deferred
		await interaction.followUp("Discord ID is empty.")
		return
	}

	const [id] = await Promise.all([getWSID(user), deferred])
	await interaction.followUp(id ?? "This used doesn't have a WSID.")
}

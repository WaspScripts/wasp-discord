import {
	ActivityType,
	ApplicationCommandType,
	ButtonInteraction,
	Client,
	Collection,
	CommandInteraction,
	CommandInteractionOptionResolver,
	Guild,
	GuildMember,
	ModalSubmitInteraction,
	Role,
	type ActionRowModalData,
	type ApplicationCommandData,
	type ApplicationCommandDataResolvable,
	type ClientEvents,
	type GuildTextBasedChannel,
	type LabelModalData
} from "discord.js"

import type { Database } from "$lib/types/supabase"
import { Glob } from "bun"
import { getGuildChannel, getGuildRole } from "$lib/utils"

export type ChannelKey = "management" | "achievements" | "bans"
export type MappedChannel = Record<ChannelKey, GuildTextBasedChannel>
export type MappedRole = Record<Roles, Role>

export type Roles = Database["profiles"]["Enums"]["roles"]

export interface CommandInteractionEx extends CommandInteraction {
	member: GuildMember
}

export type Command = ApplicationCommandData & {
	roles?: Roles[]
	run: (options: {
		client: ClientEx
		caller: string
		interaction: CommandInteractionEx
		args: CommandInteractionOptionResolver
	}) => void
}

export interface ModalSubmitInteractionEx extends ModalSubmitInteraction {
	member: GuildMember
}

export type Modal = ApplicationCommandData & {
	roles?: Roles[]
	run: (options: {
		client: ClientEx
		member: GuildMember
		interaction: ModalSubmitInteractionEx
		data: (ActionRowModalData | LabelModalData)[]
	}) => void
}

export interface ButtonInteractionEx extends ButtonInteraction {
	member: GuildMember
}

export type Button = ApplicationCommandData & {
	roles?: Roles[]
	run: (options: { client: ClientEx; member: GuildMember; interaction: ButtonInteractionEx }) => void
}

export class ClientEvent<Key extends keyof ClientEvents> {
	constructor(
		public event: Key,
		public run: (client: ClientEx, ...args: ClientEvents[Key]) => void
	) {}
}

export class ClientEx extends Client {
	guild: Guild = {} as Guild
	channelsMap: MappedChannel = {} as MappedChannel
	roles: MappedRole = {} as MappedRole

	commands: Collection<string, Command> = new Collection()
	modals: Collection<string, Modal> = new Collection()
	buttons: Collection<string, Button> = new Collection()

	async registerModules() {
		const commands: ApplicationCommandDataResolvable[] = []
		let path = process.cwd() + "/src/interactions/commands/"
		let glob = new Glob(path + "**/*{.ts,.js}")

		for await (const file of glob.scan(".")) {
			const imported = await import(file)
			if (!imported) return
			const command: Command = imported.default

			switch (command.type) {
				case ApplicationCommandType.User:
					console.log("Adding user context command: ", command.name)
					break

				case ApplicationCommandType.Message:
					console.log("Adding message context command: ", command.name)
					break

				default:
					console.log("Adding slash command: ", command.name)
					break
			}

			this.commands.set(command.name, command)
			commands.push(command)
		}

		path = process.cwd() + "/src/interactions/modals/"
		glob = new Glob(path + "**/*{.ts,.js}")

		for await (const file of glob.scan(".")) {
			const imported = await import(file)
			if (!imported) return
			const modal: Modal = imported.default

			console.log("Adding modal: ", modal.name)

			this.modals.set(modal.name, modal)
			commands.push(modal)
		}

		path = process.cwd() + "/src/interactions/buttons/"
		glob = new Glob(path + "**/*{.ts,.js}")

		for await (const file of glob.scan(".")) {
			const imported = await import(file)
			if (!imported) return
			const button: Button = imported.default

			console.log("Adding button: ", button.name)

			this.buttons.set(button.name, button)
			commands.push(button)
		}

		this.once("clientReady", async () => {
			if (!this.user) throw new Error("Client as no user assigned.")

			for (const guild of this.guilds.cache.values()) {
				if (guild.id !== process.env.GUILD_ID) continue
				console.log("Setting up guild:", guild.name, " id: ", guild.id)

				this.guild = guild
				const channelKeys = Object.keys(this.channelsMap) as ChannelKey[]
				const roleKeys = Object.keys(this.roles) as Roles[]

				const [channels, roles] = await Promise.all([
					Promise.all(channelKeys.map((key) => getGuildChannel(guild, key))),
					Promise.all(roleKeys.map((key) => getGuildRole(guild, key)))
				])

				channelKeys.forEach((key, i) => (this.channelsMap[key] = channels[i]))
				roleKeys.forEach((key, i) => (this.roles[key] = roles[i]))
				console.log("Registering commands to:", guild.name)

				await guild.commands.set(commands)
			}

			this.user.setPresence({
				activities: [{ name: "OSRS with Simba", type: ActivityType.Playing }],
				status: "online"
			})

			console.log(`Client ready! Logged in as ${this.user.username}`)
		})
	}

	async registerEvents() {
		const path = process.cwd() + "/src/events/"
		const glob = new Glob(path + "**/*{.ts,.js}")
		for await (const file of glob.scan(".")) {
			const imported = await import(file)
			if (!imported) return
			const event = imported.default as ClientEvent<keyof ClientEvents>
			this.on(event.event, (...args) => event.run(this, ...args))
			console.log("Listening to event: ", event.event)
		}
	}

	async start() {
		await this.registerModules()
		await this.registerEvents()
		await this.login(process.env.DISCORD_TOKEN)
	}
}

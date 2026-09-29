import {
	ActivityType,
	ApplicationCommandType,
	ButtonInteraction,
	Client,
	Collection,
	CommandInteraction,
	CommandInteractionOptionResolver,
	Events,
	Guild,
	GuildMember,
	ModalSubmitInteraction,
	PermissionFlagsBits,
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
import { getDatabaseListener, supabase } from "./supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

const channelKeys = ["management", "achievements", "bans"] as const
type ChannelKey = (typeof channelKeys)[number]

export type DBRole = Database["profiles"]["Enums"]["roles"]

export interface CommandInteractionEx extends CommandInteraction {
	member: GuildMember
}

export type Command = ApplicationCommandData & {
	roles?: DBRole[]
	run: (options: {
		client: ClientEx
		caller: string
		interaction: CommandInteractionEx
		args: CommandInteractionOptionResolver
	}) => Promise<unknown> | void
}

export interface ModalSubmitInteractionEx extends ModalSubmitInteraction {
	member: GuildMember
}

export type Modal = ApplicationCommandData & {
	roles?: DBRole[]
	run: (options: {
		client: ClientEx
		member: GuildMember
		interaction: ModalSubmitInteractionEx
		data: (ActionRowModalData | LabelModalData)[]
	}) => Promise<unknown> | void
}

export interface ButtonInteractionEx extends ButtonInteraction {
	member: GuildMember
}

export type Button = ApplicationCommandData & {
	roles?: DBRole[]
	run: (options: {
		client: ClientEx
		member: GuildMember
		interaction: ButtonInteractionEx
	}) => Promise<unknown> | void
}

export interface RawGatewayPacket {
	op: number
	s: number | null
	t: string
	d: unknown
}

declare module "discord.js" {
	interface ClientEvents {
		raw: [packet: RawGatewayPacket, shardId: number]
	}
}

export class ClientEvent<Key extends keyof ClientEvents> {
	constructor(
		public event: Key,
		public run: (client: ClientEx, ...args: ClientEvents[Key]) => Promise<unknown> | void
	) {}
}

export const CLIENT_ROLES = ["contributor", "tester", "scripter"]

export class ClientEx extends Client {
	guild = {} as Guild
	channelsMap = {} as Record<ChannelKey, GuildTextBasedChannel | undefined>
	roles = {} as Record<DBRole, Role>

	commands: Collection<string, Command> = new Collection()
	modals: Collection<string, Modal> = new Collection()
	buttons: Collection<string, Button> = new Collection()
	dbListener = {} as RealtimeChannel

	async registerModules() {
		const commands: ApplicationCommandDataResolvable[] = []
		const commandsPath = process.cwd() + "/src/interactions/commands/"
		const commandsGlob = new Glob(commandsPath + "**/*{.ts,.js}")
		for await (const file of commandsGlob.scan(".")) {
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

		const modalsPath = process.cwd() + "/src/interactions/modals/"
		const modalsGlob = new Glob(modalsPath + "**/*{.ts,.js}")
		for await (const file of modalsGlob.scan(".")) {
			const imported = await import(file)
			if (!imported) return
			const modal: Modal = imported.default

			console.log("Adding modal: ", modal.name)

			this.modals.set(modal.name, modal)
			commands.push(modal)
		}

		const buttonsPath = process.cwd() + "/src/interactions/buttons/"
		const buttonsGlob = new Glob(buttonsPath + "**/*{.ts,.js}")
		for await (const file of buttonsGlob.scan(".")) {
			const imported = await import(file)
			if (!imported) return
			const button: Button = imported.default

			console.log("Adding button: ", button.name)

			this.buttons.set(button.name, button)
			commands.push(button)
		}

		this.once(Events.ClientReady, async () => {
			if (!this.user) throw new Error("Client as no user assigned.")

			const rolesPromise = supabase.schema("profiles").rpc("get_roles_enum")

			for (const guild of this.guilds.cache.values()) {
				if (guild.id !== process.env.GUILD_ID) continue

				console.log("Setting up guild:", guild.name, " id: ", guild.id)
				this.guild = guild

				if (!guild.members.me?.permissions.has(PermissionFlagsBits.KickMembers)) {
					console.warn("Missing Kick Members permission, join requests won't be received.")
				}

				const { data, error } = await rolesPromise
				if (error) {
					throw new Error("Database function error: :\n```json\n" + JSON.stringify(error) + "\n```")
				}

				const roleKeys = data as DBRole[]

				const [channels, roles] = await Promise.all([
					Promise.all(channelKeys.map((key) => getGuildChannel(guild, key))),
					Promise.all(roleKeys.map((key) => getGuildRole(guild, key)))
				])

				channelKeys.forEach((key, i) => {
					this.channelsMap[key] = channels[i]
					const channel = channels[i]
					const me = guild.members.me
					if (
						channel &&
						me &&
						!channel
							.permissionsFor(me)
							.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])
					) {
						console.warn(
							"Missing View Channel/Send Messages permission in " + key + " channel: " + channel.name
						)
					}
				})

				roleKeys.forEach((key, i) => {
					this.roles[key] = roles[i]
				})

				console.log("Registering commands to:", guild.name)
				await guild.commands.set(commands)
			}

			this.user.setPresence({
				activities: [{ name: "OSRS with Simba", type: ActivityType.Playing }],
				status: "online"
			})

			console.log(`Client ready! Logged in as ${this.user.username}`)

			this.dbListener = getDatabaseListener(this)
		})
	}

	async registerEvents() {
		const path = process.cwd() + "/src/events/"
		const glob = new Glob(path + "**/*{.ts,.js}")
		for await (const file of glob.scan(".")) {
			const imported = await import(file)
			if (!imported) return
			const event = imported.default as ClientEvent<keyof ClientEvents>
			this.on(event.event, (...args) =>
				Promise.resolve()
					.then(() => event.run(this, ...args))
					.catch((e) => console.error("Event " + event.event + " failed:", e))
			)
			console.log("Listening to event: ", event.event)
		}
	}

	async start() {
		await this.registerModules()
		await this.registerEvents()
		await this.login(process.env.DISCORD_TOKEN)
	}
}

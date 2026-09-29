import { ClientEvent } from "$lib/client"
import { Events } from "discord.js"

type Decision = "APPROVED" | "REJECTED"

interface FormResponse {
	label: string
	field_type: "TERMS" | "TEXT_INPUT" | "PARAGRAPH" | "MULTIPLE_CHOICE"
	response: boolean | number | string | null
	choices?: string[]
}

interface JoinRequest {
	id: string
	user_id: string
	user: { username: string }
	application_status: "STARTED" | "SUBMITTED" | Decision
	form_responses: FormResponse[]
}

const REJECT_ANSWERS: Record<string, string> = {
	"Are you affiliated with Jagex in any way?": "Yes"
}

const EXPECTED_ANSWERS: Record<string, string> = {
	"Are you affiliated with Jagex in any way?": "No",
	"You understand that botting/macroing is usually against the rules of video games and may be banned by doing so.":
		"Yes",
	"Lying to the questions above are against the terms of service of this platform": "I accept"
}

const MIN_TEXT_LENGTH = 3

const REJECTION_REASON = "Your answers don't meet the requirements to join this server."

const inProgress = new Set<string>()

function review(responses: FormResponse[]): { decision: Decision | null; issues: string[] } {
	const issues: string[] = []

	for (const field of responses) {
		switch (field.field_type) {
			case "TERMS":
				if (field.response !== true) return { decision: "REJECTED", issues: [] }
				break

			case "TEXT_INPUT":
			case "PARAGRAPH": {
				const text = typeof field.response === "string" ? field.response.trim() : ""
				if (text.length < MIN_TEXT_LENGTH) issues.push(field.label + ": " + JSON.stringify(text))
				break
			}

			case "MULTIPLE_CHOICE": {
				const answer = field.choices?.[field.response as number]
				if (REJECT_ANSWERS[field.label] === answer) return { decision: "REJECTED", issues: [] }

				const expected = EXPECTED_ANSWERS[field.label]
				if (expected === undefined) issues.push(field.label + ": unknown question")
				else if (answer !== expected) issues.push(field.label + ": " + answer)
				break
			}
		}
	}

	return { decision: issues.length > 0 ? null : "APPROVED", issues }
}

export default new ClientEvent(Events.Raw, async (client, packet) => {
	if (packet.t !== "GUILD_JOIN_REQUEST_CREATE" && packet.t !== "GUILD_JOIN_REQUEST_UPDATE") return

	const { guild_id, request } = packet.d as { guild_id: string; request?: JoinRequest }
	if (guild_id !== process.env.GUILD_ID || !request) return
	if (request.application_status !== "SUBMITTED" || inProgress.has(request.id)) return

	const applicant = "<@" + request.user_id + "> (" + request.user.username + ")"
	const log = (content: string) =>
		client.channelsMap.management
			?.send({ content, allowedMentions: { parse: [] } })
			.catch((e) => console.error(e))

	const { decision, issues } = review(request.form_responses)
	if (!decision) {
		await log("Join request from " + applicant + " needs manual review:\n- " + issues.join("\n- "))
		return
	}

	inProgress.add(request.id)
	try {
		await client.rest.patch(`/guilds/${guild_id}/requests/${request.id}`, {
			body:
				decision === "APPROVED"
					? { action: decision }
					: { action: decision, rejection_reason: REJECTION_REASON }
		})
		await log((decision === "APPROVED" ? "Approved" : "Rejected") + " join request from " + applicant)
	} catch (error) {
		console.error(error)
		await log(
			"Failed to " + (decision === "APPROVED" ? "approve" : "reject") + " join request from " + applicant
		)
	} finally {
		inProgress.delete(request.id)
	}
})

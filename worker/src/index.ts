import { DurableObject } from "cloudflare:workers";
export interface Env {
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_REALTIMEKIT_APP_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  CLASSROOMS: DurableObjectNamespace<ClassroomCoordinator>;
}

type Role = "teacher" | "student" | "ta";

type JoinBody = {
  classId: string;
  userId: string;
  displayName: string;
  role: Role;
};

type ClassroomRecord = {
  classId: string;
  title: string;
  teacherName: string;
};

type JoinResponse = {
  classTitle: string;
  teacherName: string;
  meetingId: string;
  authToken: string;
  participantId: string;
  displayName: string;
  role: Role;
};

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

const CLASSROOMS: Record<string, ClassroomRecord> = {
  "math-101": {
    classId: "math-101",
    title: "Math 101",
    teacherName: "Mrs. Johnson",
  },
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

function presetForRole(role: Role) {
  switch (role) {
    case "teacher":
      return "teacher"; // change if your preset name differs
    case "ta":
      return "student"; // change later if you add a TA preset
    case "student":
    default:
      return "student";
  }
}

async function cfFetch(env: Env, path: string, init?: RequestInit) {
  const res = await fetch(`${CF_API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      ...(init?.headers || {}),
    },
  });

  const data = await res.json<any>();

  if (!res.ok || data?.success === false) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

async function createMeeting(env: Env, title: string) {
  const data = await cfFetch(
    env,
    `/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/realtime/kit/${env.CLOUDFLARE_REALTIMEKIT_APP_ID}/meetings`,
    {
      method: "POST",
      body: JSON.stringify({
        title,
        ai_config: {
          transcription: {
            language: "en-US",
            profanity_filter: false,
            keywords: ["algebra", "calculus", "homework", "quiz", "assignment"],
          },
        },
      }),
    }
  );

  const meeting = data.data;
  if (!meeting?.id) {
    throw new Error(`Meeting creation failed: ${JSON.stringify(data)}`);
  }

  return meeting;
}

async function addParticipant(
  env: Env,
  args: {
    meetingId: string;
    name: string;
    presetName: string;
    customParticipantId: string;
  }
) {
  const data = await cfFetch(
    env,
    `/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/realtime/kit/${env.CLOUDFLARE_REALTIMEKIT_APP_ID}/meetings/${args.meetingId}/participants`,
    {
      method: "POST",
      body: JSON.stringify({
        name: args.name,
        preset_name: args.presetName,
        custom_participant_id: args.customParticipantId,
      }),
    }
  );

  const participant = data.data;
  if (!participant?.token) {
    throw new Error(`Participant creation failed: ${JSON.stringify(data)}`);
  }

  return {
    participantId: participant.id,
    authToken: participant.token,
    name: participant.name,
  };
}

export class ClassroomCoordinator extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const env = this.env as Env;
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return json({ ok: true });
    }

    if (url.pathname === "/join" && request.method === "POST") {
      try {
        const body = (await request.json()) as JoinBody;

        if (!body.classId || !body.userId || !body.displayName || !body.role) {
          return json({ error: "Missing required fields." }, 400);
        }

        const classroom = CLASSROOMS[body.classId];
        if (!classroom) {
          return json({ error: "Classroom not found." }, 404);
        }

        // Strongly consistent, per-object storage
        let meetingId = await this.ctx.storage.get<string>("activeMeetingId");

        if (!meetingId) {
          const meeting = await createMeeting(env, `${classroom.title} Live Session`);
          meetingId = meeting.id;
          await this.ctx.storage.put("activeMeetingId", meetingId);
        }

        const participant = await addParticipant(env, {
          meetingId,
          name: body.displayName,
          presetName: presetForRole(body.role),
          customParticipantId: body.userId,
        });

        const response: JoinResponse = {
          classTitle: classroom.title,
          teacherName: classroom.teacherName,
          meetingId,
          authToken: participant.authToken,
          participantId: participant.participantId,
          displayName: participant.name,
          role: body.role,
        };

        return json(response);
      } catch (error) {
        return json(
          {
            error: error instanceof Error ? error.message : "Unknown server error",
          },
          500
        );
      }
    }

    if (url.pathname === "/debug" && request.method === "GET") {
      const activeMeetingId = await this.ctx.storage.get<string>("activeMeetingId");
      return json({ activeMeetingId: activeMeetingId ?? null });
    }

    return json({ error: "Not found" }, 404);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return json({ ok: true });
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ ok: true });
    }

    if (url.pathname === "/api/classroom/join" && request.method === "POST") {
      const body = (await request.json()) as JoinBody;

      if (!body.classId) {
        return json({ error: "classId is required" }, 400);
      }

      // Same name => same Durable Object instance
      const id = env.CLASSROOMS.idFromName(body.classId);
      const stub = env.CLASSROOMS.get(id);

      return stub.fetch("https://classroom-do/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    if (url.pathname.startsWith("/api/classroom/debug/") && request.method === "GET") {
      const classId = url.pathname.split("/").pop();
      if (!classId) {
        return json({ error: "classId is required" }, 400);
      }

      const id = env.CLASSROOMS.idFromName(classId);
      const stub = env.CLASSROOMS.get(id);

      return stub.fetch("https://classroom-do/debug");
    }

    return json({ error: "Not found" }, 404);
  },
};
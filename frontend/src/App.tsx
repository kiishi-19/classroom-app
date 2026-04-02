import { useMemo, useState } from "react";
import { MeetingRoom } from "./MeetingRoom";

type Role = "student" | "teacher" | "ta";

type JoinResponse = {
  classTitle: string;
  teacherName: string;
  meetingId: string;
  authToken: string;
  participantId: string;
  displayName: string;
  role: Role;
};

const workerBaseUrl = import.meta.env.VITE_WORKER_BASE_URL as string;

export default function App() {
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [session, setSession] = useState<JoinResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleDescription = useMemo(() => {
    if (role === "teacher") return "Start and manage the classroom session";
    if (role === "ta") return "Support moderation and classroom operations";
    return "Join class as a learner";
  }, [role]);

  async function joinClass() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${workerBaseUrl}/api/classroom/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: "math-101",
          userId: crypto.randomUUID(),
          displayName: name || "Guest User",
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join classroom");
      }

      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (session) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-white">
        <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 p-6">
          <aside className="hidden w-[320px] shrink-0 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur xl:block">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
                Classroom Live
              </p>
              <h1 className="mt-3 text-2xl font-semibold">{session.classTitle}</h1>
              <p className="mt-2 text-sm text-white/65">
                Teacher: {session.teacherName}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/50">Signed in as</p>
                <p className="mt-1 font-medium">{session.displayName}</p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/50">Role</p>
                <p className="mt-1 font-medium capitalize">{session.role}</p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/50">Meeting ID</p>
                <p className="mt-1 break-all text-sm text-white/75">
                  {session.meetingId}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
              Session is live and ready.
            </div>
          </aside>

          <main className="flex min-h-[88vh] flex-1 flex-col">
            <div className="mb-4 flex items-center justify-between rounded-[28px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
              <div>
                <p className="text-sm text-white/55">Now in session</p>
                <h2 className="text-xl font-semibold">{session.classTitle}</h2>
              </div>

              <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                Live
              </div>
            </div>

            <div className="flex-1">
              <MeetingRoom authToken={session.authToken} />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              Realtime classroom
            </div>

            <h1 className="mt-6 text-5xl font-semibold leading-tight">
              Teach and learn in a clean, modern live classroom.
            </h1>

            <p className="mt-5 max-w-xl text-lg text-white/70">
              Built on Cloudflare RealtimeKit with role-based joining, a polished
              session shell, and a flexible base for future classroom features.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/50">Live video</p>
                <p className="mt-1 font-medium">Fast classroom sessions</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/50">Role-aware</p>
                <p className="mt-1 font-medium">Teacher, TA, student</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/50">Modern UI</p>
                <p className="mt-1 font-medium">Clean and polished</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">
              Join class
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Enter the classroom</h2>
            <p className="mt-2 text-sm text-white/60">
              Connect through your Worker backend, then enter the live room.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm text-white/70">Your name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bimi"
                  className="w-full rounded-2xl border border-white/10 bg-[#0d1528] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-cyan-400/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0d1528] px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="ta">TA</option>
                </select>
                <p className="mt-2 text-sm text-white/50">{roleDescription}</p>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              <button
                onClick={joinClass}
                disabled={loading}
                className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Joining..." : "Join Classroom"}
              </button>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                Worker URL: <span className="text-white/80">{workerBaseUrl}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

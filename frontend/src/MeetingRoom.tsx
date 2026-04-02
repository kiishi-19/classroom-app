import { useEffect, useMemo, useState } from "react";
import {
  RealtimeKitProvider,
  useRealtimeKitClient,
  useRealtimeKitMeeting,
} from "@cloudflare/realtimekit-react";
import {
  RtkMeeting,
  RtkAiTranscriptions,
} from "@cloudflare/realtimekit-react-ui";
import RealtimeKitVideoBackground from "@cloudflare/realtimekit-ui-addons/video-background";

const BACKGROUNDS = [
  {
    label: "Classroom",
    url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop",
  },
  {
    label: "Library",
    url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2000&auto=format&fit=crop",
  },
  {
    label: "Office",
    url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=2000&auto=format&fit=crop",
  },
];

function MeetingInner() {
  const { meeting } = useRealtimeKitMeeting();
  const [videoBackground, setVideoBackground] = useState<any>(null);
  const [bgLoading, setBgLoading] = useState(false);
  const [bgError, setBgError] = useState("");

  const canUseEffects = useMemo(() => !!meeting, [meeting]);

  useEffect(() => {
    let mounted = true;

    async function setupVideoBackground() {
      try {
        if (!meeting) return;

        const addon = await RealtimeKitVideoBackground.init({
          meeting,
          modes: ["blur", "virtual", "random"],
          blurStrength: 30,
          images: BACKGROUNDS.map((b) => b.url),
        });

        if (mounted) {
          setVideoBackground(addon);
        }
      } catch (err) {
        if (mounted) {
          setBgError(
            err instanceof Error
              ? err.message
              : "Failed to initialize background effects"
          );
        }
      }
    }

    void setupVideoBackground();

    return () => {
      mounted = false;
    };
  }, [meeting]);

  async function applyBlur() {
    if (!videoBackground) return;
    try {
      setBgLoading(true);
      setBgError("");
      await videoBackground.applyBlurBackground();
    } catch (err) {
      setBgError(
        err instanceof Error ? err.message : "Failed to apply blur background"
      );
    } finally {
      setBgLoading(false);
    }
  }

  async function applyVirtual(url: string) {
    if (!videoBackground) return;
    try {
      setBgLoading(true);
      setBgError("");
      await videoBackground.applyVirtualBackground(url);
    } catch (err) {
      setBgError(
        err instanceof Error ? err.message : "Failed to apply virtual background"
      );
    } finally {
      setBgLoading(false);
    }
  }

  async function clearBackground() {
    if (!videoBackground) return;
    try {
      setBgLoading(true);
      setBgError("");
      await videoBackground.removeBackground();
    } catch (err) {
      setBgError(
        err instanceof Error ? err.message : "Failed to remove background"
      );
    } finally {
      setBgLoading(false);
    }
  }

  return (
    <div className="grid h-full w-full gap-4 lg:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/30 shadow-2xl h-[75vh] lg:h-full">
        <RtkMeeting mode="fill" meeting={meeting} showSetupScreen={true} />
      </div>

      <aside className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur">
        <section>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
            Live captions
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">Transcript</h3>
          <p className="mt-1 text-sm text-white/60">
            Real-time captions from the classroom.
          </p>

          <div className="mt-3 h-[220px] overflow-y-auto rounded-2xl bg-black/20 p-3">
            <RtkAiTranscriptions initialTranscriptions={[]} meeting={meeting} />
          </div>
        </section>

        <section>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
            Video effects
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Backgrounds
          </h3>
          <p className="mt-1 text-sm text-white/60">
            Blur your room or replace it with a virtual background.
          </p>

          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={applyBlur}
                disabled={!canUseEffects || bgLoading}
                className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-50"
              >
                {bgLoading ? "Working..." : "Blur"}
              </button>

              <button
                onClick={clearBackground}
                disabled={!canUseEffects || bgLoading}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.label}
                  onClick={() => applyVirtual(bg.url)}
                  disabled={!canUseEffects || bgLoading}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 text-left disabled:opacity-50"
                >
                  <img
                    src={bg.url}
                    alt={bg.label}
                    className="h-12 w-20 rounded-lg object-cover"
                  />
                  <span className="text-sm text-white">{bg.label}</span>
                </button>
              ))}
            </div>

            {bgError ? (
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
                {bgError}
              </div>
            ) : null}
          </div>
        </section>
      </aside>
    </div>
  );
}

export function MeetingRoom({ authToken }: { authToken: string }) {
  const [meeting, initMeeting] = useRealtimeKitClient();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setError("");
        await initMeeting({ authToken });
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to initialize meeting"
          );
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [authToken, initMeeting]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center rounded-[28px] border border-red-400/20 bg-red-400/10 p-6 text-red-100">
        {error}
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center rounded-[28px] border border-white/10 bg-white/5 text-white/80">
        Joining classroom...
      </div>
    );
  }

  return (
    <RealtimeKitProvider value={meeting}>
      <MeetingInner />
    </RealtimeKitProvider>
  );
}
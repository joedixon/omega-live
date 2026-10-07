import { initials } from '@/components/live/presence';
import type { Shoutout } from '@/types';

export function Feed({
    shoutouts,
    fresh,
    now,
}: {
    shoutouts: Shoutout[];
    fresh: Set<number>;
    now: number;
}) {
    if (shoutouts.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
                No shoutouts yet. Be the first.
            </div>
        );
    }

    return (
        <ul className="flex flex-col gap-2.5">
            {shoutouts.map((shoutout) => (
                <li
                    key={shoutout.id}
                    className={
                        fresh.has(shoutout.id)
                            ? 'animate-slide-in rounded-2xl border border-white/15 bg-white/[0.07] p-3.5 shadow-[0_0_40px_-10px] shadow-[#f53003]/40'
                            : 'rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5'
                    }
                >
                    <div className="flex items-start gap-3">
                        <div
                            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                            style={{ backgroundColor: shoutout.color }}
                        >
                            {initials(shoutout.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2 text-xs">
                                <span
                                    className="font-semibold"
                                    style={{ color: shoutout.color }}
                                >
                                    {shoutout.name}
                                </span>
                                <span className="shrink-0 text-white/35 tabular-nums">
                                    {ago(shoutout.at, now)}
                                </span>
                            </div>
                            <p className="mt-0.5 text-[15px] leading-snug break-words text-white/90">
                                {shoutout.body}
                            </p>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}

function ago(at: string | null, now: number): string {
    if (!at) {
        return '';
    }

    const seconds = Math.max(0, Math.round((now - Date.parse(at)) / 1000));

    if (seconds < 10) {
        return 'just now';
    }

    if (seconds < 60) {
        return `${seconds}s`;
    }

    if (seconds < 3600) {
        return `${Math.floor(seconds / 60)}m`;
    }

    if (seconds < 86400) {
        return `${Math.floor(seconds / 3600)}h`;
    }

    return `${Math.floor(seconds / 86400)}d`;
}

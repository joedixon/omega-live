import type { Member } from '@/types';

export function Presence({ members, me }: { members: Member[]; me: Member }) {
    const shown = members.slice(0, 8);
    const hidden = members.length - shown.length;

    return (
        <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
                {shown.map((member) => (
                    <div
                        key={member.id}
                        title={
                            member.id === me.id
                                ? `${member.name} (you)`
                                : member.name
                        }
                        className="flex size-9 animate-pop-in items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-[#07070a]"
                        style={{ backgroundColor: member.color }}
                    >
                        {initials(member.name)}
                    </div>
                ))}
                {hidden > 0 && (
                    <div className="flex size-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white ring-2 ring-[#07070a]">
                        +{hidden}
                    </div>
                )}
            </div>
            <div className="text-sm leading-tight">
                <div className="font-semibold tabular-nums">
                    {members.length} here now
                </div>
                <div className="text-white/50">
                    you're{' '}
                    <span style={{ color: me.color }} className="font-medium">
                        {me.name}
                    </span>
                </div>
            </div>
        </div>
    );
}

export function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2);
}

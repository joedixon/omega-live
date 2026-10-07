import type { Member } from '@/types';

export function Presence({ members, me }: { members: Member[]; me: Member }) {
    const shown = members.slice(0, 6);
    const hidden = members.length - shown.length;

    return (
        <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
                {shown.map((member) => (
                    <Avatar
                        key={member.id}
                        member={member}
                        title={
                            member.id === me.id
                                ? `${member.name} (you)`
                                : member.name
                        }
                        className="size-9 animate-pop-in ring-2 ring-white"
                    />
                ))}
                {hidden > 0 && (
                    <div className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600 tabular-nums ring-2 ring-white">
                        +{hidden}
                    </div>
                )}
            </div>
            <div className="text-sm/5">
                <p className="font-medium whitespace-nowrap text-zinc-950 tabular-nums">
                    {members.length} here now
                </p>
                <p className="text-zinc-500 max-sm:hidden">
                    You're{' '}
                    <span className="font-medium" style={{ color: me.color }}>
                        {me.name}
                    </span>
                    .
                </p>
            </div>
        </div>
    );
}

export function Avatar({
    member,
    title,
    className,
}: {
    member: Pick<Member, 'name' | 'color'>;
    title?: string;
    className?: string;
}) {
    return (
        <div
            title={title ?? member.name}
            className={`flex shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white outline-1 -outline-offset-1 outline-black/10 ${className ?? ''}`}
            style={{ backgroundColor: member.color }}
        >
            {initials(member.name)}
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

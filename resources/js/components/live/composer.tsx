import { useForm } from '@inertiajs/react';
import { cn } from '@/lib/utils';

const LIMIT = 140;

export function Composer({ onSend }: { onSend: (nonce: string) => void }) {
    const form = useForm({ body: '', nonce: '' });
    const remaining = LIMIT - form.data.body.length;

    function submit(event: React.FormEvent) {
        event.preventDefault();

        if (!form.data.body.trim() || form.processing) {
            return;
        }

        // Only needs to be unique within this tab; `crypto.randomUUID` is
        // missing outside secure contexts, such as plain-HTTP local sites.
        const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        onSend(nonce);

        form.transform((data) => ({ ...data, nonce }));
        form.post('/shoutouts', {
            only: ['stats'],
            preserveScroll: true,
            onSuccess: () => form.reset('body'),
        });
    }

    return (
        <form onSubmit={submit} className="relative">
            <input
                value={form.data.body}
                onChange={(event) => form.setData('body', event.target.value)}
                maxLength={LIMIT}
                placeholder="Say something to everyone here…"
                aria-label="Shoutout"
                className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.06] pr-28 pl-5 text-base text-white placeholder:text-white/35 focus:border-[#f53003]/60 focus:ring-4 focus:ring-[#f53003]/15 focus:outline-none"
            />
            <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                <span
                    className={cn(
                        'text-xs tabular-nums',
                        remaining < 20 ? 'text-[#f53003]' : 'text-white/30',
                    )}
                >
                    {remaining}
                </span>
                <button
                    type="submit"
                    disabled={!form.data.body.trim() || form.processing}
                    className="h-10 rounded-xl bg-[#f53003] px-4 text-sm font-semibold text-white transition hover:bg-[#ff4a1f] disabled:opacity-40"
                >
                    Send
                </button>
            </div>
            {form.errors.body && (
                <p className="mt-2 text-sm text-[#ff6b4a]">
                    {form.errors.body}
                </p>
            )}
        </form>
    );
}

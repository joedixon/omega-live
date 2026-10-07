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
        <form onSubmit={submit}>
            <div className="relative">
                <input
                    name="body"
                    value={form.data.body}
                    onChange={(event) =>
                        form.setData('body', event.target.value)
                    }
                    maxLength={LIMIT}
                    placeholder="Say something to everyone here…"
                    aria-label="Shoutout"
                    autoComplete="off"
                    className="h-14 w-full rounded-2xl bg-white pr-28 pl-5 text-base text-zinc-950 shadow-sm ring-1 ring-zinc-950/10 placeholder:text-zinc-400 focus:outline-2 focus:-outline-offset-1 focus:outline-brand"
                />
                <div className="absolute inset-y-0 right-2 flex items-center gap-3">
                    <p
                        className={cn(
                            'text-sm/6 tabular-nums',
                            remaining < 20 ? 'text-brand' : 'text-zinc-400',
                        )}
                    >
                        {remaining}
                    </p>
                    <button
                        type="submit"
                        disabled={!form.data.body.trim() || form.processing}
                        className="rounded-xl bg-brand px-3.5 py-2 text-sm/6 font-semibold text-white shadow-sm hover:bg-[#dc2b02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-40"
                    >
                        Send
                    </button>
                </div>
            </div>
            {form.errors.body && (
                <p className="mt-2 text-base/6 text-brand sm:text-sm/6">
                    {form.errors.body}
                </p>
            )}
        </form>
    );
}

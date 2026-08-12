"use client";

import { useActionState, useRef } from "react";
import { addNote, type NoteFormState } from "@/actions/note";

export function NoteForm({ businessId }: { businessId: string }) {
  const action = addNote.bind(null, businessId);
  const [state, formAction, pending] = useActionState<NoteFormState, FormData>(
    action,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2"
    >
      <textarea
        name="content"
        required
        rows={3}
        placeholder="Ziyaret notu, görüşme özeti…"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
      {state?.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Ekleniyor…" : "Not ekle"}
      </button>
    </form>
  );
}

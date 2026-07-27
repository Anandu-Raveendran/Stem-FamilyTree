import React from 'react';
import { ArrowRight, PlusCircle, Link2, PencilLine, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    title: 'Add a new member',
    description:
      'Click the Add Member button to create a new person. Always add a parent first so you can search for them while adding children',
    icon: PlusCircle,
  },
  {
    title: 'Link them to family',
    description:
      'Search for existing family members to connect them as parents or partners.',
    icon: Link2,
  },
  {
    title: 'Edit details',
    description:
      'Tap a person card and choose Edit(Pencil icon) to update their information.',
    icon: PencilLine,
  },
];

export default function HowToPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_40%),linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(248,250,252,0.95))] px-4 py-10 text-ink-light dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.22),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.96))] dark:text-ink-dark sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-neutral-900/70 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
                <Sparkles className="h-4 w-4" />
                Quick guide
              </div>
              <div>
                <h1 className="text-3xl font-semibold sm:text-4xl">Build your family tree in a few simple steps</h1>
                <p className="mt-2 text-sm leading-6 text-ink-light/70 dark:text-ink-dark/70 sm:text-base">
                  Learn how to add people, connect them with parents and partners, and update details whenever your family story changes.
                </p>
                <h3 className="text-red-500"> Dont panic if anything goes wrong. Just text Anandu.</h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              Back
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-[1.5rem] border border-black/10 bg-white/80 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-neutral-900/70">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-accent">Step {index + 1}</p>
                  <h2 className="mt-1 text-xl font-semibold">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-ink-light/70 dark:text-ink-dark/70">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-neutral-900/70 sm:p-8">
          <h2 className="text-2xl font-semibold">Pro tips</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-ink-light/70 dark:text-ink-dark/70">
            <li className="flex items-start gap-2">
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-accent" />
              Add parents first then create that parents children. This will make it easier to find the parent when adding children.
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-accent" />
              Add mother and father as partners first.
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-accent" />
              In a child add both mother and father as parents. This will make the lines solid not dotted lines.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

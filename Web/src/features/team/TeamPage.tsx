import { BriefcaseBusiness, Ellipsis, Plus, Users } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { SectionHeading } from "../../components/ui/SectionHeading";
import type { TeamMember } from "../../types/workspace";

type TeamPageProps = {
  members: TeamMember[];
  onInvite: () => void;
};

export function TeamPage({ members, onInvite }: TeamPageProps) {
  return (
    <>
      <SectionHeading
        eyebrow="YOUR WORKSPACE"
        title="Our team"
        description="People and collaboration, all in one place."
        action="Invite teammate"
        onAction={onInvite}
      />

      <div className="my-5 flex items-center gap-2.5 rounded-[13px] border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-3.5 sm:gap-3 sm:p-[18px]">
        <span className="grid size-9 flex-none place-items-center rounded-xl bg-indigo-100 text-brand sm:size-[42px]">
          <Users size={21} />
        </span>
        <div>
          <strong className="text-[10px] sm:text-xs">8 teammates online</strong>
          <p className="m-0 mt-1 text-[9px] text-slate-500 sm:text-[10px]">
            Your team is collaborating on Website Redesign
          </p>
        </div>
        <span className="ml-auto hidden items-center gap-1.5 whitespace-nowrap text-[9px] font-semibold text-emerald-700 sm:inline-flex">
          <i className="size-1.5 rounded-full bg-emerald-500 ring-[3px] ring-emerald-100" />
          Team online
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
        {members.map((member, index) => (
          <article
            key={member.initials}
            className="relative flex min-h-[185px] flex-col items-center rounded-[13px] border border-slate-200 bg-white px-3 py-5 shadow-card"
          >
            <button
              type="button"
              className="absolute top-2 right-2 grid size-[30px] place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label={`More options for ${member.name}`}
            >
              <Ellipsis size={19} />
            </button>
            <Avatar initials={member.initials} className={member.avatar} size="large" />
            <h3 className="mb-0 mt-2.5 text-[11px] font-bold">{member.name}</h3>
            <p className="m-0 mt-1 text-[9px] text-slate-500">{member.role}</p>
            <div className="mt-3.5 inline-flex items-center gap-1 text-[9px] text-slate-500">
              <BriefcaseBusiness size={14} />
              {index % 2 === 0 ? "Website Redesign" : "Mobile App Launch"}
            </div>
            <span className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-medium text-emerald-700">
              <i className="size-1.5 rounded-full bg-emerald-500" /> Online
            </span>
          </article>
        ))}
        <button
          type="button"
          className="flex min-h-[185px] flex-col items-center justify-center gap-2 rounded-[13px] border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-brand"
          onClick={onInvite}
        >
          <span className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white"><Plus size={20} /></span>
          <strong className="text-[10px]">Invite a teammate</strong>
          <small className="text-[9px] text-slate-400">Bring your team together</small>
        </button>
      </div>
    </>
  );
}

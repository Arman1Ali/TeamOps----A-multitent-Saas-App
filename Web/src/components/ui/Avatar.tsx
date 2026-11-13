/**
 * A circle of initials, and a row of them.
 *
 * This module belongs to the UI primitives layer (src/components/ui): small,
 * presentational, no data of its own.
 *
 * The initials come from the API (`UserBrief.initials`, derived server-side
 * from the name), so this component never works them out itself. That keeps
 * "Sung Arman" -> "SA" meaning the same thing in the task row, the team list
 * and the avatar stack on a project card.
 */

type AvatarProps = {
  initials: string;
  className?: string;
  size?: "default" | "large";
};

const avatarColors = [
  "bg-violet-100 text-violet-800",
  "bg-sky-100 text-sky-800",
  "bg-pink-100 text-pink-800",
];

export function Avatar({ initials, className = "", size = "default" }: AvatarProps) {
  const dimensions =
    size === "large" ? "size-[52px] rounded-2xl text-sm" : "size-[30px] rounded-[10px] text-[9px]";

  return (
    <span
      className={`inline-grid flex-none place-items-center border-2 border-white font-bold ${dimensions} ${className}`}
    >
      {initials}
    </span>
  );
}

/**
 * Up to three people, overlapping, then "+n".
 *
 * A project card has room for three faces; the count is what matters, not the
 * fourth initial, so the rest become a number rather than a clipped circle.
 */
export function AvatarStack({ people }: { people: string[] }) {
  if (people.length === 0) {
    return <span className="text-[9px] text-slate-400">Nobody assigned yet</span>;
  }

  return (
    <div className="flex items-center" aria-label={`${people.length} people with work here`}>
      {people.slice(0, 3).map((person, index) => (
        <Avatar
          key={`${person}-${index}`}
          initials={person}
          className={`${index > 0 ? "-ml-2" : ""} ${avatarColors[index % avatarColors.length]}`}
        />
      ))}
      {people.length > 3 && (
        <span className="-ml-2 inline-grid size-[30px] place-items-center rounded-[10px] border-2 border-white bg-slate-100 text-[9px] font-bold text-slate-600">
          +{people.length - 3}
        </span>
      )}
    </div>
  );
}

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
  const dimensions = size === "large" ? "size-[52px] rounded-2xl text-sm" : "size-[30px] rounded-[10px] text-[9px]";

  return (
    <span className={`inline-grid flex-none place-items-center border-2 border-white font-bold ${dimensions} ${className}`}>
      {initials}
    </span>
  );
}

export function AvatarStack({ people }: { people: string[] }) {
  return (
    <div className="flex items-center" aria-label={`${people.length} project members`}>
      {people.slice(0, 3).map((person, index) => (
        <Avatar
          key={person}
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

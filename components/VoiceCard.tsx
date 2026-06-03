type VoiceCardProps = {
  name: string;
  gender: string;
  description: string;
  active?: boolean;
};

export default function VoiceCard({
  name,
  gender,
  description,
  active = false,
}: VoiceCardProps) {
  const isFemale = gender === "WANITA" || gender === "Female";

  return (
    <div
      className={`relative flex items-center gap-4 rounded-xl border p-4 transition ${
        active
          ? "border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-950/30"
          : "border-slate-800 bg-slate-950 hover:border-slate-600 hover:bg-slate-900"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border font-bold ${
          isFemale
            ? "border-pink-500/30 bg-pink-500/10 text-pink-300"
            : "border-blue-500/30 bg-blue-500/10 text-blue-300"
        }`}
      >
        {name[0]}
      </div>

      <div className="min-w-0 flex-1 pr-8">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-white">{name}</h3>
          <span
            className={`rounded-md border px-2 py-0.5 text-[10px] ${
              isFemale
                ? "border-pink-500/20 bg-pink-500/5 text-pink-300"
                : "border-blue-500/20 bg-blue-500/5 text-blue-300"
            }`}
          >
            {gender}
          </span>
        </div>

        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          {description}
        </p>
      </div>

      {active && (
        <div className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
          ON
        </div>
      )}
    </div>
  );
}

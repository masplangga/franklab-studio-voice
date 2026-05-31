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
      className={`relative flex items-center gap-4 rounded-2xl border p-4 transition-all ${
        active
          ? "border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20"
          : "border-slate-800 bg-slate-950/50 hover:border-blue-700 hover:bg-slate-900"
      }`}
    >
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold border ${
          isFemale
            ? "bg-pink-500/10 text-pink-300 border-pink-500/30"
            : "bg-blue-500/10 text-blue-300 border-blue-500/30"
        }`}
      >
        {name[0]}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold text-sm">{name}</h3>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-md border ${
              isFemale
                ? "text-pink-300 border-pink-500/20 bg-pink-500/5"
                : "text-blue-300 border-blue-500/20 bg-blue-500/5"
            }`}
          >
            {gender}
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          {description}
        </p>
      </div>

      {active && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
          ✓
        </div>
      )}
    </div>
  );
}
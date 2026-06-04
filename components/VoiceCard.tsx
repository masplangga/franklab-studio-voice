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
      className={`relative flex min-h-[86px] items-center gap-4 rounded-[16px] border p-4 transition ${
        active
          ? "border-[#6d5cff] bg-[#132248] shadow-[0_0_0_1px_rgba(109,92,255,0.35)]"
          : "border-[#2a3551] bg-[#080e20] hover:border-[#dce3f4]"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-base font-black ${
          isFemale
            ? "border-[#7b4bff]/35 bg-[#3a215d] text-[#d7b7ff]"
            : "border-[#245bb6]/50 bg-[#0d2a58] text-[#63a7ff]"
        }`}
      >
        {name[0]}
      </div>

      <div className="min-w-0 flex-1 pr-8">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-black text-white">{name}</h3>
          <span
            className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
              isFemale
                ? "border-[#7b4bff]/25 bg-[#7b4bff]/10 text-[#cdbdff]"
                : "border-[#2165ca]/40 bg-[#0c3168] text-[#61a8ff]"
            }`}
          >
            {gender}
          </span>
        </div>

        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#91a0bf]">
          {description}
        </p>
      </div>

      {active && (
        <div className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#6d5cff] text-[10px] font-black text-white">
          OK
        </div>
      )}
    </div>
  );
}

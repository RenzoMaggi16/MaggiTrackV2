import React from "react";
import clsx from "clsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmotionalStateIndicatorProps {
  emotion: string;
  className?: string;
}

// Mapeo de emociones a estilos visuales
const emotionStyles: Record<string, { emoji: string; bgColor: string; glowShadow: string; textColor: string; hexColor: string }> = {
  Confianza: { emoji: "😎", bgColor: "bg-sky-500", glowShadow: "shadow-sky-400/60", textColor: "text-white", hexColor: "#0ea5e9" },
  Paciencia: { emoji: "🧘‍♂️", bgColor: "bg-emerald-500", glowShadow: "shadow-emerald-400/60", textColor: "text-white", hexColor: "#22c55e" },
  Euforia: { emoji: "🤩", bgColor: "bg-yellow-400", glowShadow: "shadow-yellow-300/60", textColor: "text-gray-900", hexColor: "#facc15" },
  Neutral: { emoji: "😐", bgColor: "bg-zinc-400", glowShadow: "shadow-white/20", textColor: "text-white", hexColor: "#a1a1aa" },
  Ansiedad: { emoji: "😟", bgColor: "bg-orange-400", glowShadow: "shadow-orange-300/60", textColor: "text-white", hexColor: "#fb923c" },
  Miedo: { emoji: "😱", bgColor: "bg-violet-600", glowShadow: "shadow-violet-500/60", textColor: "text-white", hexColor: "#8b5cf6" },
  Frustración: { emoji: "😡", bgColor: "bg-red-600", glowShadow: "shadow-red-500/60", textColor: "text-white", hexColor: "#dc2626" },
  Venganza: { emoji: "😈", bgColor: "bg-red-700", glowShadow: "shadow-red-600/60", textColor: "text-white", hexColor: "#b91c1c" },
  Default: { emoji: "❓", bgColor: "bg-zinc-600", glowShadow: "shadow-zinc-500/50", textColor: "text-white", hexColor: "#52525b" },
};

export const EmotionalStateIndicator: React.FC<EmotionalStateIndicatorProps> = ({ emotion, className }) => {
  const current = emotionStyles[emotion] || emotionStyles.Default;

  return (
    <Card className={clsx("p-4 flex flex-col items-center justify-center text-center", className)}>
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-sm font-medium">Emoción Frecuente</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-0">
        <div
          className={`relative w-28 h-28 rounded-full flex items-center justify-center text-5xl font-bold mb-3 ${current.bgColor} shadow-2xl ${current.glowShadow}`}
          style={{
            backgroundImage: `radial-gradient(circle at center, ${current.hexColor}55 0%, transparent 70%)`,
            boxShadow: `0 0 24px ${current.hexColor}88`,
            transition: "transform 200ms ease, box-shadow 200ms ease",
          }}
        >
          <span className="select-none">{current.emoji}</span>
        </div>
        <p className={`text-base font-semibold ${current.textColor}`}>{emotion || "-"}</p>
        <p className="text-xs text-muted-foreground mt-1">Emoción predominante</p>
      </CardContent>
    </Card>
  );
};

export default EmotionalStateIndicator;



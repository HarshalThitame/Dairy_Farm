"use client";

const pieces = ["🥛", "✨", "🎉", "⭐", "💚", "🥛", "✨", "🎉"];

export default function DairyConfetti({ active }) {
  if (!active) {
    return null;
  }

  return (
    <div className="dairy-confetti" aria-hidden="true">
      {pieces.map((piece, index) => (
        <span
          key={`${piece}-${index}`}
          style={{
            "--confetti-left": `${10 + index * 11}%`,
            "--confetti-delay": `${index * 90}ms`,
            "--confetti-drift": `${index % 2 === 0 ? -12 : 12}px`
          }}
        >
          {piece}
        </span>
      ))}
    </div>
  );
}

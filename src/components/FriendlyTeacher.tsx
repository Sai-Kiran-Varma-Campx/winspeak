/**
 * Friendly female teacher avatar.
 * When `speaking` is true, mouth animates and sound waves appear.
 */
export default function FriendlyTeacher({ speaking = false, size = 120 }: { speaking?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="60" cy="60" r="56" fill="#EDE9FE" />
      <circle cx="60" cy="60" r="56" stroke="#C4B5FD" strokeWidth="1.5" />

      {/* Hair — long, flowing, dark brown */}
      <path d="M28 48 Q28 16 60 14 Q92 16 92 48 L92 80 Q88 86 80 88 L76 78 Q72 82 60 82 Q48 82 44 78 L40 88 Q32 86 28 80 Z" fill="#3D2216" />
      {/* Hair highlights */}
      <path d="M36 24 Q48 14 64 16 Q78 18 86 28" stroke="#5A3A24" strokeWidth="1.5" fill="none" />
      <path d="M40 20 Q52 12 68 16" stroke="#6B4830" strokeWidth="0.8" fill="none" />
      {/* Front hair framing face */}
      <path d="M34 44 Q36 26 52 20 Q60 18 68 20 Q84 26 86 44" fill="#4A2C18" />
      {/* Side hair flowing */}
      <path d="M28 48 Q26 58 28 72 Q30 80 36 84" fill="#3D2216" />
      <path d="M92 48 Q94 58 92 72 Q90 80 84 84" fill="#3D2216" />

      {/* Ears */}
      <ellipse cx="37" cy="52" rx="3" ry="5" fill="#F5D0B0" />
      <ellipse cx="83" cy="52" rx="3" ry="5" fill="#F5D0B0" />
      {/* Earrings */}
      <circle cx="37" cy="58" r="2" fill="#A78BFA" />
      <circle cx="83" cy="58" r="2" fill="#A78BFA" />

      {/* Face */}
      <ellipse cx="60" cy="52" rx="23" ry="25" fill="#FDDCB5" />

      {/* Eyebrows — thin, arched */}
      <path d="M43 40 Q48 36 54 39" stroke="#4A2C18" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M66 39 Q72 36 77 40" stroke="#4A2C18" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Eyes — expressive with lashes */}
      <ellipse cx="48" cy="47" rx="3.5" ry="4" fill="#1E1133" />
      <ellipse cx="72" cy="47" rx="3.5" ry="4" fill="#1E1133" />
      {/* Eye shine */}
      <circle cx="49.5" cy="45.5" r="1.3" fill="#fff" />
      <circle cx="73.5" cy="45.5" r="1.3" fill="#fff" />
      {/* Eyelashes */}
      <path d="M43 43 Q44 41 45 43" stroke="#1E1133" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M45 42 Q46 40 47.5 42.5" stroke="#1E1133" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M72.5 42.5 Q74 40 75 42" stroke="#1E1133" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M75 43 Q76 41 77 43" stroke="#1E1133" strokeWidth="0.8" strokeLinecap="round" fill="none" />

      {/* Nose */}
      <path d="M58 54 Q60 57 62 54" stroke="#E8B890" strokeWidth="1.2" strokeLinecap="round" fill="none" />

      {/* Cheeks — rosy */}
      <circle cx="40" cy="56" r="4" fill="#F5A0A0" opacity="0.25" />
      <circle cx="80" cy="56" r="4" fill="#F5A0A0" opacity="0.25" />

      {/* Lips */}
      {speaking ? (
        <ellipse cx="60" cy="63" rx="5" ry="3.5" fill="#D4626A">
          <animate attributeName="ry" values="3.5;2;4.5;2.5;3.5" dur="0.5s" repeatCount="indefinite" />
          <animate attributeName="rx" values="5;3.5;6;4;5" dur="0.5s" repeatCount="indefinite" />
        </ellipse>
      ) : (
        <>
          {/* Upper lip */}
          <path d="M54 62 Q57 60 60 62 Q63 60 66 62" fill="#D4626A" />
          {/* Lower lip */}
          <path d="M54 62 Q60 67 66 62" fill="#E07078" />
        </>
      )}

      {/* Neck */}
      <rect x="53" y="74" width="14" height="5" rx="2" fill="#F5D0B0" />

      {/* Top — purple blouse */}
      <path d="M32 84 Q32 76 60 76 Q88 76 88 84 L92 116 L28 116 Z" fill="#7C3AED" />
      {/* Neckline — V shape */}
      <path d="M50 78 L60 90 L70 78" fill="#FDDCB5" />
      {/* Collar detail */}
      <path d="M48 80 L54 86" stroke="#6D28D9" strokeWidth="0.8" />
      <path d="M72 80 L66 86" stroke="#6D28D9" strokeWidth="0.8" />

      {/* Necklace */}
      <path d="M50 80 Q60 86 70 80" stroke="#C4B5FD" strokeWidth="1" fill="none" />
      <circle cx="60" cy="84" r="2.5" fill="#A78BFA" />

      {/* Sound waves — only when speaking */}
      {speaking && (
        <g>
          <path d="M94 44 Q100 48 94 52" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1s" repeatCount="indefinite" />
          </path>
          <path d="M99 38 Q108 48 99 58" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.05;0.3" dur="1.2s" repeatCount="indefinite" />
          </path>
          <path d="M26 44 Q20 48 26 52" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1s" repeatCount="indefinite" begin="0.3s" />
          </path>
          <path d="M21 38 Q12 48 21 58" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.05;0.3" dur="1.2s" repeatCount="indefinite" begin="0.3s" />
          </path>
        </g>
      )}
    </svg>
  );
}

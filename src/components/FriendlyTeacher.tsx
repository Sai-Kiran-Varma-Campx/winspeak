/**
 * A friendly cartoon teacher SVG.
 * When `speaking` is true, the mouth animates and sound waves appear.
 */
export default function FriendlyTeacher({ speaking = false, size = 120 }: { speaking?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hair */}
      <ellipse cx="60" cy="48" rx="36" ry="38" fill="#5C3D2E" />
      {/* Face */}
      <ellipse cx="60" cy="54" rx="30" ry="32" fill="#FDDCB5" />
      {/* Hair bangs */}
      <path d="M30 44 Q40 26 60 28 Q80 26 90 44" fill="#5C3D2E" />
      {/* Eyes */}
      <ellipse cx="47" cy="52" rx="4" ry="4.5" fill="#2A1F1A" />
      <ellipse cx="73" cy="52" rx="4" ry="4.5" fill="#2A1F1A" />
      {/* Eye shine */}
      <circle cx="48.5" cy="50.5" r="1.5" fill="#fff" />
      <circle cx="74.5" cy="50.5" r="1.5" fill="#fff" />
      {/* Eyebrows */}
      <path d="M40 45 Q47 41 54 45" stroke="#5C3D2E" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M66 45 Q73 41 80 45" stroke="#5C3D2E" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Rosy cheeks */}
      <circle cx="38" cy="60" r="5" fill="#F9A8D4" opacity="0.5" />
      <circle cx="82" cy="60" r="5" fill="#F9A8D4" opacity="0.5" />
      {/* Mouth */}
      {speaking ? (
        /* Speaking mouth — animated open/close */
        <ellipse cx="60" cy="67" rx="8" ry="6" fill="#E8794A">
          <animate attributeName="ry" values="6;4;7;5;6" dur="0.6s" repeatCount="indefinite" />
          <animate attributeName="rx" values="8;6;9;7;8" dur="0.6s" repeatCount="indefinite" />
        </ellipse>
      ) : (
        /* Resting smile */
        <path d="M50 65 Q60 75 70 65" stroke="#E8794A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      )}
      {/* Body / top */}
      <path d="M30 86 Q30 78 60 78 Q90 78 90 86 L94 120 L26 120 Z" fill="#EA580C" />
      {/* Collar */}
      <path d="M50 80 L60 90 L70 80" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Sound waves — only when speaking */}
      {speaking && (
        <g>
          <path d="M98 50 Q106 54 98 58" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1s" repeatCount="indefinite" />
          </path>
          <path d="M104 44 Q116 54 104 64" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.2s" repeatCount="indefinite" />
          </path>
          <path d="M22 50 Q14 54 22 58" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1s" repeatCount="indefinite" begin="0.3s" />
          </path>
          <path d="M16 44 Q4 54 16 64" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.2s" repeatCount="indefinite" begin="0.3s" />
          </path>
        </g>
      )}
    </svg>
  );
}

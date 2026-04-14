/**
 * Soft purple clouds scattered across the full viewport.
 * Kid-friendly, professional. Fixed position — stays during scroll.
 */
export default function CloudsBg() {
  return (
    <div className="clouds-bg" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
        {/* ── Top row ── */}
        <g opacity="0.55">
          <ellipse cx="120" cy="100" rx="90" ry="40" fill="#DDD6FE" />
          <ellipse cx="170" cy="80" rx="70" ry="35" fill="#EDE9FE" />
          <ellipse cx="80" cy="90" rx="55" ry="30" fill="#E9E4FC" />
        </g>

        <g opacity="0.5">
          <ellipse cx="420" cy="140" rx="85" ry="35" fill="#C4B5FD" />
          <ellipse cx="470" cy="120" rx="60" ry="30" fill="#DDD6FE" />
          <ellipse cx="380" cy="130" rx="50" ry="28" fill="#E9E4FC" />
        </g>

        <g opacity="0.45">
          <ellipse cx="680" cy="70" rx="60" ry="25" fill="#DDD6FE" />
          <ellipse cx="720" cy="55" rx="45" ry="22" fill="#EDE9FE" />
        </g>

        <g opacity="0.55">
          <ellipse cx="920" cy="110" rx="95" ry="40" fill="#C4B5FD" />
          <ellipse cx="970" cy="90" rx="70" ry="35" fill="#DDD6FE" />
          <ellipse cx="880" cy="100" rx="55" ry="30" fill="#E9E4FC" />
        </g>

        <g opacity="0.5">
          <ellipse cx="1220" cy="150" rx="85" ry="35" fill="#DDD6FE" />
          <ellipse cx="1270" cy="130" rx="60" ry="30" fill="#EDE9FE" />
          <ellipse cx="1180" cy="140" rx="50" ry="28" fill="#E9E4FC" />
        </g>

        <g opacity="0.4">
          <ellipse cx="1380" cy="80" rx="55" ry="25" fill="#C4B5FD" />
          <ellipse cx="1410" cy="65" rx="40" ry="20" fill="#DDD6FE" />
        </g>

        {/* ── Upper middle row ── */}
        <g opacity="0.35">
          <ellipse cx="260" cy="280" rx="70" ry="28" fill="#DDD6FE" />
          <ellipse cx="300" cy="260" rx="50" ry="24" fill="#EDE9FE" />
        </g>

        <g opacity="0.4">
          <ellipse cx="620" cy="300" rx="80" ry="30" fill="#C4B5FD" />
          <ellipse cx="660" cy="280" rx="55" ry="26" fill="#DDD6FE" />
        </g>

        <g opacity="0.35">
          <ellipse cx="1080" cy="290" rx="75" ry="28" fill="#DDD6FE" />
          <ellipse cx="1120" cy="275" rx="55" ry="26" fill="#EDE9FE" />
        </g>

        <g opacity="0.3">
          <ellipse cx="1380" cy="320" rx="60" ry="24" fill="#C4B5FD" />
          <ellipse cx="1410" cy="305" rx="45" ry="20" fill="#DDD6FE" />
        </g>

        {/* ── Middle row ── */}
        <g opacity="0.32">
          <ellipse cx="80" cy="470" rx="70" ry="26" fill="#DDD6FE" />
          <ellipse cx="120" cy="455" rx="50" ry="22" fill="#EDE9FE" />
        </g>

        <g opacity="0.3">
          <ellipse cx="440" cy="490" rx="75" ry="28" fill="#C4B5FD" />
          <ellipse cx="480" cy="475" rx="55" ry="24" fill="#DDD6FE" />
        </g>

        <g opacity="0.32">
          <ellipse cx="820" cy="470" rx="70" ry="26" fill="#DDD6FE" />
          <ellipse cx="860" cy="455" rx="50" ry="22" fill="#EDE9FE" />
        </g>

        <g opacity="0.28">
          <ellipse cx="1200" cy="500" rx="80" ry="30" fill="#C4B5FD" />
          <ellipse cx="1240" cy="485" rx="55" ry="25" fill="#DDD6FE" />
        </g>

        {/* ── Lower middle row ── */}
        <g opacity="0.3">
          <ellipse cx="260" cy="670" rx="75" ry="28" fill="#DDD6FE" />
          <ellipse cx="300" cy="655" rx="55" ry="24" fill="#EDE9FE" />
        </g>

        <g opacity="0.28">
          <ellipse cx="640" cy="680" rx="70" ry="26" fill="#C4B5FD" />
          <ellipse cx="680" cy="665" rx="50" ry="22" fill="#DDD6FE" />
        </g>

        <g opacity="0.3">
          <ellipse cx="1020" cy="660" rx="80" ry="30" fill="#DDD6FE" />
          <ellipse cx="1060" cy="645" rx="55" ry="25" fill="#EDE9FE" />
        </g>

        {/* ── Bottom row ── */}
        <g opacity="0.3">
          <ellipse cx="180" cy="830" rx="80" ry="30" fill="#DDD6FE" />
          <ellipse cx="220" cy="815" rx="60" ry="26" fill="#EDE9FE" />
          <ellipse cx="140" cy="820" rx="50" ry="24" fill="#E9E4FC" />
        </g>

        <g opacity="0.28">
          <ellipse cx="560" cy="850" rx="70" ry="26" fill="#C4B5FD" />
          <ellipse cx="600" cy="835" rx="50" ry="22" fill="#DDD6FE" />
        </g>

        <g opacity="0.3">
          <ellipse cx="920" cy="830" rx="85" ry="32" fill="#DDD6FE" />
          <ellipse cx="960" cy="815" rx="60" ry="26" fill="#EDE9FE" />
        </g>

        <g opacity="0.25">
          <ellipse cx="1320" cy="850" rx="70" ry="26" fill="#C4B5FD" />
          <ellipse cx="1360" cy="835" rx="50" ry="22" fill="#DDD6FE" />
        </g>
      </svg>
    </div>
  );
}

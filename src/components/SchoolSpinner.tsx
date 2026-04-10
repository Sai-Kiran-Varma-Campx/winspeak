interface SchoolSpinnerProps {
  size?: number;
}

const DOTS = [
  { color: '#EA580C', delay: '0s' },
  { color: '#DB2777', delay: '0.15s' },
  { color: '#F59E0B', delay: '0.3s' },
];

export default function SchoolSpinner({ size = 12 }: SchoolSpinnerProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      {DOTS.map((dot, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: dot.color,
            animation: `schoolBounce 1.2s ease-in-out ${dot.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

interface Step {
  label: string;
  status: "active" | "completed" | "pending";
}

interface StepProgressProps {
  steps: Step[];
}

export default function StepProgress({ steps }: StepProgressProps) {
  return (
    <div className="flex gap-1.5">
      {steps.map((step, i) => {
        const isDone = step.status === "completed" || step.status === "active";
        return (
          <div key={i} className="flex-1 flex flex-col gap-1">
            <div
              className="h-1 sm:h-[3px] rounded-full"
              style={{
                background: isDone ? "var(--accent)" : "var(--border)",
              }}
            />
            <div
              className="text-[10px] sm:text-[9px] font-semibold text-center"
              style={{
                color: isDone ? "var(--accent)" : "var(--muted)",
              }}
            >
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

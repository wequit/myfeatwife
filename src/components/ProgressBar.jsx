export default function ProgressBar({ current, total }) {
  if (total === 0) return null;
  const pct = Math.round((current / total) * 100);
  return (
    <>
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-label">
        {current}/{total}
      </div>
    </>
  );
}

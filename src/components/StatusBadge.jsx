import { STATUS_COLORS } from '../utils/metrics.js';

export default function StatusBadge({ status }) {
  const c = STATUS_COLORS[status];
  return (
    <span className="status-badge" style={{ '--c': c }}>
      <i /> {status}
    </span>
  );
}

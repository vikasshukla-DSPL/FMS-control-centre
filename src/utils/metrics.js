export const STATUS = {
  COMPLETE: 'Complete',
  FMS_ONLY: 'FMS live',
  NOT_LINKED: 'Not linked',
};

export const STATUS_COLORS = {
  [STATUS.COMPLETE]: '#1f9d6b',
  [STATUS.FMS_ONLY]: '#7a4bb0',
  [STATUS.NOT_LINKED]: '#e08a2e',
};

export function statusOf(r) {
  if (r.fms && r.sop) return STATUS.COMPLETE;
  if (r.fms) return STATUS.FMS_ONLY;
  return STATUS.NOT_LINKED;
}

export const withStatus = (list) => list.map((r) => ({ ...r, status: statusOf(r) }));

export const getCategories = (records) => [...new Set(records.map((r) => r.category).filter(Boolean))].sort();

const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100));

export function summarise(list) {
  const total = list.length;
  const withFms = list.filter((r) => r.fms).length;
  const withSop = list.filter((r) => r.sop).length;
  const complete = list.filter((r) => r.status === STATUS.COMPLETE).length;
  const notLinked = list.filter((r) => r.status === STATUS.NOT_LINKED).length;
  return {
    total,
    withFms,
    withSop,
    complete,
    notLinked,
    fmsOnly: withFms - complete,
    fmsPct: pct(withFms, total),
    sopPct: pct(withSop, total),
  };
}

export function byCategory(records) {
  return getCategories(records)
    .map((c) => ({ category: c, ...summarise(records.filter((r) => r.category === c)) }))
    .sort((a, b) => b.total - a.total);
}

export function statusBreakdown(records) {
  const s = summarise(records);
  return [
    { name: STATUS.COMPLETE, value: s.complete },
    { name: STATUS.FMS_ONLY, value: s.fmsOnly },
    { name: STATUS.NOT_LINKED, value: s.notLinked },
  ];
}

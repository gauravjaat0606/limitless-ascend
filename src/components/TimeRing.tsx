import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Clock as ClockIcon, Check, Flame, Layers, Sparkles, Activity, AlertTriangle, Zap, Moon, Battery, TrendingDown, RadioTower } from 'lucide-react';

/* ============================================================
   TYPES
   ============================================================ */
export type ZonePriority = 'CRITICAL' | 'HIGH' | 'OPTIMAL' | 'DECAY';

export interface TimeZoneItem {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  color: string; // hex
  startMinutes: number; // 0-1439, minutes since 12:00 AM
  endMinutes: number; // 0-1439 (exclusive); may be numerically < startMinutes to represent wrap past midnight
  elasticity: number; // 0 = rigid (won't budge when the schedule shifts) .. 1 = fluid (absorbs shift easily)
  priority: ZonePriority; // how costly it is when this zone gets disrupted
}

interface DragState {
  type: 'move' | 'resize-start' | 'resize-end';
  zoneId: string;
  originStart: number;
  originEnd: number;
  originPointerMinutes: number;
  moved: boolean;
}

interface TimeRingProps {
  darkMode: boolean;
}

/* ============================================================
   DOMINO SHIFT ENGINE
   ============================================================ */
const PRIORITY_MULTIPLIER: Record<ZonePriority, number> = {
  CRITICAL: 2.5,
  HIGH: 1.6,
  OPTIMAL: 1.0,
  DECAY: 0.5,
};

const PRIORITY_META: Record<ZonePriority, { label: string; color: string }> = {
  CRITICAL: { label: 'Critical', color: '#EF4444' },
  HIGH: { label: 'High', color: '#F59E0B' },
  OPTIMAL: { label: 'Optimal', color: '#10B981' },
  DECAY: { label: 'Decay', color: '#6B7280' },
};

export interface DominoAffectedZone {
  zoneId: string;
  title: string;
  icon: string;
  color: string;
  appliedDelay: number;
  newStart: number;
  newEnd: number;
  priority: ZonePriority;
  elasticity: number;
}

export interface DominoConflict {
  aId: string;
  bId: string;
  aTitle: string;
  bTitle: string;
  overlapMinutes: number;
}

export interface DominoResult {
  updatedZones: TimeZoneItem[];
  shiftedZoneId: string;
  triggerDelay: number;
  affected: DominoAffectedZone[];
  conflicts: DominoConflict[];
  stressScore: number; // 0-100
  biologicalCost: number;
}

/** Circular overlap in minutes between two half-open windows on a 24h wheel, start up to but excluding end. */
function overlapMinutes(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  const aSpan = spanBetween(aStart, aEnd);
  const bSpan = spanBetween(bStart, bEnd);
  const bRelStart = wrapMinutes(bStart - aStart);
  const overlapDirect = Math.max(0, Math.min(aSpan, bRelStart + bSpan) - Math.max(0, bRelStart));
  const overlapWrapped = Math.max(0, Math.min(aSpan, bRelStart + bSpan - MINUTES_IN_DAY) - Math.max(0, bRelStart - MINUTES_IN_DAY));
  return Math.max(overlapDirect, overlapWrapped);
}

function detectConflicts(zones: TimeZoneItem[]): DominoConflict[] {
  const conflicts: DominoConflict[] = [];
  for (let i = 0; i < zones.length; i++) {
    for (let j = i + 1; j < zones.length; j++) {
      const a = zones[i];
      const b = zones[j];
      const overlap = overlapMinutes(a.startMinutes, a.endMinutes, b.startMinutes, b.endMinutes);
      if (overlap > 0) {
        conflicts.push({ aId: a.id, bId: b.id, aTitle: a.title, bTitle: b.title, overlapMinutes: Math.round(overlap) });
      }
    }
  }
  return conflicts;
}

/**
 * When a zone is dragged to a new start time, the disruption ripples forward through the
 * rest of the day. Fluid (high-elasticity) zones absorb most of the shift; rigid zones barely
 * move and instead accumulate "biological cost". The ripple decays with distance so a morning
 * delay doesn't silently reschedule your entire year.
 */
function runDominoShift(zones: TimeZoneItem[], shiftedZoneId: string, delayMinutes: number): DominoResult {
  const sorted = [...zones].sort((a, b) => a.startMinutes - b.startMinutes);
  const shiftedIdx = sorted.findIndex((z) => z.id === shiftedZoneId);

  if (shiftedIdx === -1 || Math.abs(delayMinutes) < SNAP_STEP) {
    return {
      updatedZones: zones,
      shiftedZoneId,
      triggerDelay: delayMinutes,
      affected: [],
      conflicts: detectConflicts(zones),
      stressScore: 0,
      biologicalCost: 0,
    };
  }

  const RIPPLE_DECAY = 0.55;
  const RIPPLE_FLOOR_MINUTES = 3;
  const affected: DominoAffectedZone[] = [];
  const patch = new Map<string, { startMinutes: number; endMinutes: number }>();
  let biologicalCost = 0;

  for (let step = 1; step < sorted.length; step++) {
    const zone = sorted[(shiftedIdx + step) % sorted.length];
    const rippleFactor = Math.pow(RIPPLE_DECAY, step - 1);
    const rawDelay = delayMinutes * zone.elasticity * rippleFactor;
    const appliedDelay = snapMinutes(rawDelay);

    if (Math.abs(rawDelay) < RIPPLE_FLOOR_MINUTES) break; // ripple has dissipated

    const newStart = wrapMinutes(zone.startMinutes + appliedDelay);
    const newEnd = wrapMinutes(zone.endMinutes + appliedDelay);
    patch.set(zone.id, { startMinutes: newStart, endMinutes: newEnd });

    const cost = Math.abs(appliedDelay) * PRIORITY_MULTIPLIER[zone.priority] * (1 - zone.elasticity);
    biologicalCost += cost;

    if (appliedDelay !== 0) {
      affected.push({
        zoneId: zone.id,
        title: zone.title,
        icon: zone.icon,
        color: zone.color,
        appliedDelay,
        newStart,
        newEnd,
        priority: zone.priority,
        elasticity: zone.elasticity,
      });
    }
  }

  const updatedZones = zones.map((z) => {
    const p = patch.get(z.id);
    return p ? { ...z, startMinutes: p.startMinutes, endMinutes: p.endMinutes } : z;
  });

  const stressScore = Math.max(0, Math.min(100, Math.round(biologicalCost / 4)));

  return {
    updatedZones,
    shiftedZoneId,
    triggerDelay: delayMinutes,
    affected,
    conflicts: detectConflicts(updatedZones),
    stressScore,
    biologicalCost: Math.round(biologicalCost * 10) / 10,
  };
}

/* ============================================================
   GEOMETRY HELPERS
   ============================================================ */
const RING_SIZE = 420;
const CENTER = RING_SIZE / 2;
const OUTER_RADIUS = 172;
const RING_THICKNESS = 48;
const HANDLE_RADIUS = OUTER_RADIUS - RING_THICKNESS / 2;
const SNAP_STEP = 5;
const MINUTES_IN_DAY = 1440;

const round2 = (n: number) => Math.round(n * 100) / 100;

function minutesToAngle(minutes: number): number {
  return (minutes / MINUTES_IN_DAY) * 360;
}

function snapMinutes(minutes: number, step = SNAP_STEP): number {
  return Math.round(minutes / step) * step;
}

function wrapMinutes(minutes: number): number {
  return ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
}

// Shortest signed delta (in minutes) travelling from `from` to `to` around the 24h wheel
function shortestDelta(from: number, to: number): number {
  return (((to - from + MINUTES_IN_DAY / 2) % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY - MINUTES_IN_DAY / 2;
}

function polarPoint(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: round2(CENTER + radius * Math.cos(rad)),
    y: round2(CENTER + radius * Math.sin(rad)),
  };
}

function clientPointToMinutes(clientX: number, clientY: number, rect: DOMRect): number {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const raw = (Math.atan2(dy, dx) * 180) / Math.PI;
  const clockAngle = (raw + 90 + 360) % 360;
  return (clockAngle / 360) * MINUTES_IN_DAY;
}

/** Builds a thick donut-segment path from startMin, sweeping clockwise for `spanMinutes`. */
function ringArcPath(startMin: number, spanMinutes: number, radius: number, thickness: number): string {
  const startAngle = minutesToAngle(startMin);
  const sweep = Math.min(Math.max(spanMinutes, 0.1), MINUTES_IN_DAY - 0.1) / MINUTES_IN_DAY * 360;
  const endAngle = startAngle + sweep;

  const outerStart = polarPoint(startAngle, radius);
  const outerEnd = polarPoint(endAngle, radius);
  const innerStart = polarPoint(startAngle, radius - thickness);
  const innerEnd = polarPoint(endAngle, radius - thickness);
  const largeArc = sweep > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${radius - thickness} ${radius - thickness} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function zoneSpanMinutes(zone: TimeZoneItem): number {
  return spanBetween(zone.startMinutes, zone.endMinutes);
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shadeColor(hex: string, percent: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

function spanBetween(startMin: number, endMin: number): number {
  const span = endMin - startMin;
  return span > 0 ? span : span + MINUTES_IN_DAY;
}

function formatClock(minutes: number): string {
  const m = wrapMinutes(Math.round(minutes));
  const h24 = Math.floor(m / 60);
  const min = m % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${min.toString().padStart(2, '0')} ${period}`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/* ============================================================
   PERSISTENCE
   ============================================================ */
const STORAGE_KEY = 'limitless_ascend_time_ring_zones';

const DEFAULT_ZONES: TimeZoneItem[] = [
  { id: 'zone-sleep', title: 'Sleep', description: 'Wind down and recover.', icon: '🌙', color: '#6366F1', startMinutes: 0, endMinutes: 360, elasticity: 0.15, priority: 'CRITICAL' },
  { id: 'zone-deepwork', title: 'Deep Work', description: 'Focused, distraction-free effort.', icon: '🧠', color: '#06B6D4', startMinutes: 360, endMinutes: 720, elasticity: 0.35, priority: 'HIGH' },
  { id: 'zone-skills', title: 'Skill Building', description: 'Study, practice, and learn.', icon: '📘', color: '#10B981', startMinutes: 720, endMinutes: 1080, elasticity: 0.55, priority: 'OPTIMAL' },
  { id: 'zone-personal', title: 'Personal Time', description: 'Family, rest, and life admin.', icon: '⚡', color: '#F97316', startMinutes: 1080, endMinutes: 1440, elasticity: 0.85, priority: 'DECAY' },
];

/** Fills in elasticity/priority for zones saved before the Domino Shift Engine existed. */
function withDominoDefaults(zone: Partial<TimeZoneItem> & { id: string; startMinutes: number; endMinutes: number }): TimeZoneItem {
  return {
    id: zone.id,
    title: zone.title ?? 'Zone',
    description: zone.description ?? '',
    icon: zone.icon ?? '🎯',
    color: zone.color ?? '#8B5CF6',
    startMinutes: zone.startMinutes,
    endMinutes: zone.endMinutes,
    elasticity: typeof zone.elasticity === 'number' ? zone.elasticity : 0.5,
    priority: zone.priority ?? 'OPTIMAL',
  };
}

function loadZones(): TimeZoneItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ZONES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return (parsed as TimeZoneItem[]).map(withDominoDefaults);
    return DEFAULT_ZONES;
  } catch {
    return DEFAULT_ZONES;
  }
}

function saveZones(zones: TimeZoneItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
  } catch {
    // ignore — non-fatal if storage is unavailable
  }
}

/* ============================================================
   ADAPTIVE CHAOS HORIZON
   Tracks whether each zone actually gets "checked in" day to day,
   and turns that into a rolling consistency score. Zones that keep
   getting skipped visually destabilize on the ring, and the panel
   below explains why plus forecasts the day's energy.
   ========================================================================= */
export type CheckInMap = Record<string, Record<string, boolean>>; // { 'YYYY-MM-DD': { zoneId: true|false } }

const CHECKIN_STORAGE_KEY = 'limitless_ascend_time_ring_checkins';
const CHAOS_WINDOW_DAYS = 7;
const UNSTABLE_THRESHOLD = 0.4;
const UNSTABLE_MIN_SAMPLES = 3;

function toISODateLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function loadCheckIns(): CheckInMap {
  try {
    const raw = window.localStorage.getItem(CHECKIN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? (parsed as CheckInMap) : {};
  } catch {
    return {};
  }
}

function saveCheckIns(data: CheckInMap): void {
  try {
    window.localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore — non-fatal if storage is unavailable
  }
}

export interface ZoneConsistency {
  rate: number; // 0-1
  sampled: number;
  missed: number;
  missedStreak: number;
}

function getZoneConsistency(zoneId: string, checkIns: CheckInMap, days = CHAOS_WINDOW_DAYS): ZoneConsistency {
  const today = new Date();
  let done = 0;
  let sampled = 0;
  let missedStreak = 0;
  let streakActive = true;

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const record = checkIns[toISODateLocal(d)];
    if (record && Object.prototype.hasOwnProperty.call(record, zoneId)) {
      sampled++;
      if (record[zoneId]) {
        done++;
        streakActive = false;
      } else if (streakActive) {
        missedStreak++;
      }
    }
  }

  return { rate: sampled > 0 ? done / sampled : 1, sampled, missed: sampled - done, missedStreak };
}

export interface UnstableZoneInfo extends ZoneConsistency {
  zoneId: string;
  title: string;
  icon: string;
  color: string;
}

function findUnstableZones(zones: TimeZoneItem[], checkIns: CheckInMap): UnstableZoneInfo[] {
  return zones
    .map((z) => ({ zone: z, consistency: getZoneConsistency(z.id, checkIns) }))
    .filter(({ consistency }) => consistency.sampled >= UNSTABLE_MIN_SAMPLES && consistency.rate < UNSTABLE_THRESHOLD)
    .map(({ zone, consistency }) => ({
      zoneId: zone.id,
      title: zone.title,
      icon: zone.icon,
      color: zone.color,
      ...consistency,
    }))
    .sort((a, b) => a.rate - b.rate);
}

/** How much a zone's focus has eroded so far, given how deep into it "now" is. */
function computeFocusDecay(zone: TimeZoneItem, nowMinutes: number): number {
  const span = zoneSpanMinutes(zone);
  if (span <= 0) return 100;
  const elapsed = wrapMinutes(nowMinutes - zone.startMinutes);
  const progress = Math.min(1, elapsed / span);
  const decayRange = 15 + (1 - zone.elasticity) * 35; // rigid/demanding zones burn focus faster
  return Math.round(Math.max(30, 100 - progress * decayRange));
}

export interface SleepDebtInfo {
  detected: boolean;
  scheduledMinutes: number;
  debtMinutes: number;
}

function computeSleepDebt(zones: TimeZoneItem[], checkIns: CheckInMap): SleepDebtInfo {
  const sleepZones = zones.filter((z) => /sleep/i.test(z.title));
  if (sleepZones.length === 0) return { detected: false, scheduledMinutes: 0, debtMinutes: 0 };

  const scheduledMinutes = sleepZones.reduce((sum, z) => sum + zoneSpanMinutes(z), 0);
  const RECOMMENDED_MINUTES = 480; // 8 hours
  let debt = Math.max(0, RECOMMENDED_MINUTES - scheduledMinutes);

  sleepZones.forEach((z) => {
    const c = getZoneConsistency(z.id, checkIns);
    if (c.sampled > 0) debt += Math.round((1 - c.rate) * 90);
  });

  return { detected: true, scheduledMinutes, debtMinutes: Math.round(debt) };
}

export interface EnergyPoint {
  hour: number;
  energy: number;
}

function buildEnergyForecast(zones: TimeZoneItem[], sleepDebtMinutes: number): EnergyPoint[] {
  const sorted = [...zones].sort((a, b) => a.startMinutes - b.startMinutes);
  const points: EnergyPoint[] = [];
  let energy = 100 - Math.min(40, sleepDebtMinutes / 12);

  for (let h = 0; h < 24; h++) {
    const minute = h * 60;
    const zone = sorted.find((z) => wrapMinutes(minute - z.startMinutes) < zoneSpanMinutes(z));
    if (zone && /sleep/i.test(zone.title)) {
      energy = Math.min(100, energy + 6);
    } else if (zone) {
      const drain = 1 + (1 - zone.elasticity) * 2.2 + PRIORITY_MULTIPLIER[zone.priority] * 0.6;
      energy = Math.max(5, energy - drain);
    } else {
      energy = Math.max(5, energy - 1);
    }
    points.push({ hour: h, energy: Math.round(energy) });
  }
  return points;
}

const COLOR_PRESETS = ['#06B6D4', '#10B981', '#6366F1', '#F97316', '#EC4899', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];
const ICON_PRESETS = ['🌙', '🧠', '📘', '⚡', '💪', '🎯', '🎨', '🧘', '💻', '📖', '🍳', '🚗', '🎮', '👨‍👩‍👧', '☕'];

/* ============================================================
   ZONE EDITOR MODAL
   ============================================================ */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
function minutesToTimeInput(m: number): string {
  const wrapped = wrapMinutes(Math.round(m));
  const h = Math.floor(wrapped / 60);
  const min = wrapped % 60;
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

function ZoneEditorModal({
  zone,
  darkMode,
  onSave,
  onDelete,
  onClose,
}: {
  zone: TimeZoneItem;
  darkMode: boolean;
  onSave: (zone: TimeZoneItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(zone.title);
  const [description, setDescription] = useState(zone.description);
  const [icon, setIcon] = useState(zone.icon);
  const [color, setColor] = useState(zone.color);
  const [startTime, setStartTime] = useState(minutesToTimeInput(zone.startMinutes));
  const [endTime, setEndTime] = useState(minutesToTimeInput(zone.endMinutes));
  const [elasticity, setElasticity] = useState(zone.elasticity);
  const [priority, setPriority] = useState<ZonePriority>(zone.priority);

  const panelBg = darkMode ? 'bg-gray-900 border-white/10' : 'bg-white border-black/5';
  const inputCls = darkMode
    ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-white/30'
    : 'bg-black/[0.03] border-black/10 text-gray-900 placeholder-gray-400 focus:border-black/30';

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      ...zone,
      title: title.trim(),
      description: description.trim(),
      icon: icon || '🎯',
      color,
      startMinutes: snapMinutes(timeToMinutes(startTime)),
      endMinutes: snapMinutes(timeToMinutes(endTime)),
      elasticity,
      priority,
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden ${panelBg}`}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${shadeColor(color, -15)})` }} />
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
              style={{ backgroundColor: hexToRgba(color, darkMode ? 0.2 : 0.14) }}
            >
              {icon || '🎯'}
            </span>
            <h3 className={`text-lg font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Edit Zone
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${darkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-black/5 text-gray-500'}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div className="flex gap-3">
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value.slice(0, 2))}
              className={`w-14 text-center text-xl rounded-xl border px-2 py-2.5 focus:outline-none transition-colors ${inputCls}`}
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Zone name"
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium focus:outline-none transition-colors ${inputCls}`}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {ICON_PRESETS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                  icon === ic ? (darkMode ? 'bg-white/15 ring-1 ring-white/30' : 'bg-black/10 ring-1 ring-black/20') : darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
                }`}
              >
                {ic}
              </button>
            ))}
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description (optional)"
            rows={2}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm resize-none focus:outline-none transition-colors ${inputCls}`}
          />

          <div>
            <div className={`text-xs font-medium mb-2 ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>Color</div>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_PRESETS.map((c) => (
                <motion.button
                  key={c}
                  onClick={() => setColor(c)}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="relative w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 2px ${darkMode ? '#0b0d14' : '#ffffff'}, 0 0 0 4px ${c}, 0 4px 12px -2px ${c}99` : undefined,
                  }}
                >
                  {color === c && <Check className="h-4 w-4 text-white drop-shadow" strokeWidth={3} />}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className={`text-xs font-medium mb-1.5 ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>Start</div>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none transition-colors ${inputCls}`}
              />
            </div>
            <div>
              <div className={`text-xs font-medium mb-1.5 ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>End</div>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none transition-colors ${inputCls}`}
              />
            </div>
          </div>

          <div>
            <div className={`text-xs font-medium mb-2 ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>
              Priority <span className="opacity-60">— how costly it is if this zone gets disrupted</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(PRIORITY_META) as ZonePriority[]).map((p) => {
                const meta = PRIORITY_META[p];
                const selected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className="py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all"
                    style={{
                      backgroundColor: selected ? hexToRgba(meta.color, darkMode ? 0.25 : 0.15) : darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      color: selected ? meta.color : darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                      boxShadow: selected ? `0 0 0 1.5px ${meta.color}` : undefined,
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className={`text-xs font-medium ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>
                Elasticity <span className="opacity-60">— how easily this zone shifts</span>
              </div>
              <span className={`text-xs font-semibold ${darkMode ? 'text-white/70' : 'text-gray-700'}`}>
                {elasticity < 0.34 ? 'Rigid' : elasticity < 0.67 ? 'Flexible' : 'Fluid'} · {Math.round(elasticity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(elasticity * 100)}
              onChange={(e) => setElasticity(Number(e.target.value) / 100)}
              className="w-full accent-current"
              style={{ color }}
            />
            <div className={`flex justify-between text-[10px] mt-1 ${darkMode ? 'text-white/30' : 'text-gray-400'}`}>
              <span>Rigid (won't budge)</span>
              <span>Fluid (absorbs shift)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onDelete(zone.id)}
              className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                darkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
            >
              Save Zone
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   DOMINO REPORT PANEL
   ============================================================ */
function StressGauge({ score, accent, darkMode }: { score: number; accent: string; darkMode: boolean }) {
  const severity = score >= 60 ? '#EF4444' : score >= 30 ? '#F59E0B' : '#10B981';
  const circumference = 2 * Math.PI * 26;
  const dash = (score / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
        <circle cx="32" cy="32" r="26" fill="none" strokeWidth="6" className={darkMode ? 'stroke-white/10' : 'stroke-black/[0.06]'} />
        <motion.circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          stroke={severity}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{score}</span>
      </div>
      <div className="absolute -inset-1 rounded-full -z-10" style={{ background: hexToRgba(accent, 0.08) }} />
    </div>
  );
}

function DominoReportPanel({
  report,
  zones,
  darkMode,
  onDismiss,
}: {
  report: DominoResult;
  zones: TimeZoneItem[];
  darkMode: boolean;
  onDismiss: () => void;
}) {
  const shiftedZone = zones.find((z) => z.id === report.shiftedZoneId);
  const panelBg = darkMode ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-black/[0.02] border-black/[0.06]';
  const textMuted = darkMode ? 'text-white/45' : 'text-gray-500';
  const severity = report.stressScore >= 60 ? '#EF4444' : report.stressScore >= 30 ? '#F59E0B' : '#10B981';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className={`rounded-2xl border p-5 ${panelBg}`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <StressGauge score={report.stressScore} accent={severity} darkMode={darkMode} />
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" style={{ color: severity }} />
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Domino Shift Engine</h3>
              </div>
              <p className={`text-xs mt-0.5 ${textMuted}`}>
                {report.triggerDelay !== 0 ? (
                  <>
                    {shiftedZone ? `${shiftedZone.icon} ${shiftedZone.title}` : 'A zone'} moved{' '}
                    {report.triggerDelay > 0 ? `${Math.abs(report.triggerDelay)}m later` : `${Math.abs(report.triggerDelay)}m earlier`} —
                    {' '}biological cost <span className="font-semibold">{report.biologicalCost}</span>
                  </>
                ) : (
                  <>Resizing {shiftedZone ? `${shiftedZone.icon} ${shiftedZone.title}` : 'a zone'} created a scheduling conflict</>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className={`p-1.5 rounded-full flex-shrink-0 transition-colors ${darkMode ? 'hover:bg-white/10 text-white/50' : 'hover:bg-black/5 text-gray-400'}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {report.affected.length > 0 && (
          <div className="space-y-1.5 mb-3">
            <div className={`text-[11px] font-semibold uppercase tracking-wide mb-2 ${textMuted}`}>Timeline Pressure</div>
            {report.affected.map((a) => {
              const meta = PRIORITY_META[a.priority];
              return (
                <div
                  key={a.zoneId}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl ${darkMode ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}
                >
                  <span className="text-base flex-shrink-0">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{a.title}</div>
                    <div className={`text-xs ${textMuted}`}>
                      Now {formatClock(a.newStart)} – {formatClock(a.newEnd)}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: hexToRgba(meta.color, 0.15), color: meta.color }}
                  >
                    {meta.label}
                  </span>
                  <span className={`text-xs font-semibold flex-shrink-0 w-14 text-right ${a.appliedDelay > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                    {a.appliedDelay > 0 ? '+' : ''}{a.appliedDelay}m
                  </span>
                  <span className={`text-[10px] flex-shrink-0 w-16 text-right ${textMuted}`}>
                    elasticity {Math.round(a.elasticity * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {report.conflicts.length > 0 && (
          <div className="space-y-1.5">
            <div className={`text-[11px] font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5 ${textMuted}`}>
              <AlertTriangle className="h-3 w-3 text-red-500" /> Conflicts Detected
            </div>
            {report.conflicts.map((c, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-medium">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  {c.aTitle} overlaps {c.bTitle} by {c.overlapMinutes}m
                </span>
              </div>
            ))}
          </div>
        )}

        {report.affected.length === 0 && report.conflicts.length === 0 && (
          <div className={`flex items-center gap-2 text-xs ${textMuted}`}>
            <Zap className="h-3.5 w-3.5" /> No downstream disruption — everything absorbed the change cleanly.
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================
   ADAPTIVE CHAOS HORIZON PANEL
   ============================================================ */
function EnergySparkline({ points, nowHour, darkMode }: { points: EnergyPoint[]; nowHour: number; darkMode: boolean }) {
  const w = 280;
  const h = 64;
  const pad = 4;
  const xFor = (hour: number) => pad + (hour / 23) * (w - pad * 2);
  const yFor = (energy: number) => h - pad - (energy / 100) * (h - pad * 2);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.hour)},${yFor(p.energy)}`).join(' ');
  const areaPath = `${linePath} L ${xFor(23)},${h - pad} L ${xFor(0)},${h - pad} Z`;
  const nowX = xFor(nowHour);
  const lowPoint = points.reduce((min, p) => (p.energy < min.energy ? p : min), points[0]);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16">
      <defs>
        <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#energyFill)" stroke="none" />
      <path d={linePath} fill="none" stroke="#06B6D4" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xFor(lowPoint.hour)} cy={yFor(lowPoint.energy)} r={2.5} fill="#F59E0B" />
      <line x1={nowX} y1={pad} x2={nowX} y2={h - pad} stroke={darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'} strokeWidth={1} strokeDasharray="2 2" />
    </svg>
  );
}

function ChaosHorizonPanel({
  darkMode,
  stabilityScore,
  unstableZones,
  currentZone,
  focusDecay,
  sleepDebt,
  energyForecast,
  nowHour,
}: {
  darkMode: boolean;
  stabilityScore: number;
  unstableZones: UnstableZoneInfo[];
  currentZone: TimeZoneItem | undefined;
  focusDecay: number | null;
  sleepDebt: SleepDebtInfo;
  energyForecast: EnergyPoint[];
  nowHour: number;
}) {
  const textMuted = darkMode ? 'text-white/45' : 'text-gray-500';
  const cardBg = darkMode ? 'bg-white/[0.035]' : 'bg-black/[0.025]';
  const severity = stabilityScore < 60 ? '#EF4444' : stabilityScore < 85 ? '#F59E0B' : '#10B981';
  const focusSeverity = focusDecay !== null && focusDecay < 60 ? '#EF4444' : focusDecay !== null && focusDecay < 80 ? '#F59E0B' : '#10B981';
  const sleepSeverity = sleepDebt.debtMinutes > 90 ? '#EF4444' : sleepDebt.debtMinutes > 30 ? '#F59E0B' : '#10B981';

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <RadioTower className="h-4 w-4" style={{ color: severity }} />
        <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Adaptive Chaos Horizon</h3>
        <span className={`text-xs ${textMuted}`}>— timeline stability {stabilityScore}%</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {/* Focus decay */}
        <div className={`rounded-2xl p-4 ${cardBg}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <Battery className="h-3.5 w-3.5" style={{ color: focusSeverity }} />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>Focus Decay</span>
          </div>
          {focusDecay !== null && currentZone ? (
            <>
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{focusDecay}%</div>
              <div className={`text-xs mt-0.5 ${textMuted}`}>remaining in {currentZone.icon} {currentZone.title}</div>
              <div className={`h-1.5 rounded-full mt-2 overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: focusSeverity }}
                  initial={{ width: 0 }}
                  animate={{ width: `${focusDecay}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </>
          ) : (
            <div className={`text-xs ${textMuted}`}>No active zone right now.</div>
          )}
        </div>

        {/* Sleep debt */}
        <div className={`rounded-2xl p-4 ${cardBg}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <Moon className="h-3.5 w-3.5" style={{ color: sleepSeverity }} />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>Sleep Debt</span>
          </div>
          {sleepDebt.detected ? (
            <>
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatDuration(sleepDebt.debtMinutes)}</div>
              <div className={`text-xs mt-0.5 ${textMuted}`}>
                {formatDuration(sleepDebt.scheduledMinutes)} scheduled vs 8h recommended
              </div>
            </>
          ) : (
            <div className={`text-xs ${textMuted}`}>Add a "Sleep" zone to track this.</div>
          )}
        </div>

        {/* Energy forecast */}
        <div className={`rounded-2xl p-4 ${cardBg} sm:col-span-1 col-span-1`}>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown className="h-3.5 w-3.5 text-cyan-500" />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>Energy Forecast</span>
          </div>
          <EnergySparkline points={energyForecast} nowHour={nowHour} darkMode={darkMode} />
          <div className={`text-[10px] mt-1 ${textMuted}`}>Dashed line marks now · dot marks today's low point</div>
        </div>
      </div>

      {unstableZones.length > 0 ? (
        <div className="space-y-1.5">
          {unstableZones.map((u) => (
            <div key={u.zoneId} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-red-500/[0.08] text-red-500">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-semibold">{u.icon} {u.title}</span> is becoming unstable — missed {u.missed} of the last {u.sampled} check-ins
                ({Math.round(u.rate * 100)}% consistency{u.missedStreak >= 2 ? `, ${u.missedStreak} in a row` : ''}).
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`flex items-center gap-2 text-xs px-1 ${textMuted}`}>
          <Sparkles className="h-3.5 w-3.5" /> No unstable zones detected yet — check in on zones daily using the ✓ / ✕ buttons to build up a stability history.
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MAIN TIME RING COMPONENT
   ============================================================ */
export default function TimeRing({ darkMode }: TimeRingProps) {
  const [zones, setZones] = useState<TimeZoneItem[]>(() => loadZones());
  const [now, setNow] = useState(() => new Date());
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [dominoReport, setDominoReport] = useState<DominoResult | null>(null);
  const [checkIns, setCheckIns] = useState<CheckInMap>(() => loadCheckIns());
  const svgRef = useRef<SVGSVGElement>(null);

  // live clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const nowAngle = minutesToAngle(nowMinutes);

  const sortedZones = useMemo(() => [...zones].sort((a, b) => a.startMinutes - b.startMinutes), [zones]);

  const currentZone = useMemo(() => {
    return zones.find((z) => {
      const span = zoneSpanMinutes(z);
      const rel = wrapMinutes(nowMinutes - z.startMinutes);
      return rel < span;
    });
  }, [zones, nowMinutes]);

  const timeRemaining = useMemo(() => {
    if (!currentZone) return null;
    const span = zoneSpanMinutes(currentZone);
    const elapsed = wrapMinutes(nowMinutes - currentZone.startMinutes);
    return Math.max(0, span - elapsed);
  }, [currentZone, nowMinutes]);

  const todayProgress = useMemo(() => {
    // Fraction of the 24h clock elapsed so far today.
    return Math.min(100, Math.round((nowMinutes / MINUTES_IN_DAY) * 100));
  }, [nowMinutes]);

  const todayKey = useMemo(() => toISODateLocal(now), [now]);

  const unstableZones = useMemo(() => findUnstableZones(zones, checkIns), [zones, checkIns]);
  const unstableIds = useMemo(() => new Set(unstableZones.map((u) => u.zoneId)), [unstableZones]);

  const focusDecay = useMemo(() => (currentZone ? computeFocusDecay(currentZone, nowMinutes) : null), [currentZone, nowMinutes]);

  const sleepDebt = useMemo(() => computeSleepDebt(zones, checkIns), [zones, checkIns]);

  const energyForecast = useMemo(() => buildEnergyForecast(zones, sleepDebt.debtMinutes), [zones, sleepDebt.debtMinutes]);

  const stabilityScore = useMemo(() => {
    if (zones.length === 0) return 100;
    return Math.max(0, Math.round(100 - (unstableZones.length / zones.length) * 100));
  }, [zones.length, unstableZones.length]);

  const toggleCheckIn = useCallback(
    (zoneId: string, completed: boolean) => {
      setCheckIns((prev) => {
        const next: CheckInMap = { ...prev, [todayKey]: { ...(prev[todayKey] || {}), [zoneId]: completed } };
        saveCheckIns(next);
        return next;
      });
    },
    [todayKey],
  );

  const persistZones = useCallback((next: TimeZoneItem[]) => {
    setZones(next);
    saveZones(next);
  }, []);

  const updateZoneLive = useCallback((zoneId: string, patch: Partial<TimeZoneItem>) => {
    setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, ...patch } : z)));
  }, []);

  const handlePointerDownMove = (e: ReactPointerEvent, zone: TimeZoneItem) => {
    e.stopPropagation();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const pointerMinutes = clientPointToMinutes(e.clientX, e.clientY, rect);
    setDragState({
      type: 'move',
      zoneId: zone.id,
      originStart: zone.startMinutes,
      originEnd: zone.endMinutes,
      originPointerMinutes: pointerMinutes,
      moved: false,
    });
  };

  const handlePointerDownHandle = (e: ReactPointerEvent, zone: TimeZoneItem, which: 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const pointerMinutes = clientPointToMinutes(e.clientX, e.clientY, rect);
    setDragState({
      type: which,
      zoneId: zone.id,
      originStart: zone.startMinutes,
      originEnd: zone.endMinutes,
      originPointerMinutes: pointerMinutes,
      moved: false,
    });
  };

  // window-level drag tracking
  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: PointerEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const pointerMinutes = clientPointToMinutes(e.clientX, e.clientY, rect);
      const delta = shortestDelta(dragState.originPointerMinutes, pointerMinutes);
      const moved = Math.abs(delta) > 1.5;

      if (dragState.type === 'move') {
        const snapped = snapMinutes(delta);
        updateZoneLive(dragState.zoneId, {
          startMinutes: wrapMinutes(dragState.originStart + snapped),
          endMinutes: wrapMinutes(dragState.originEnd + snapped),
        });
      } else if (dragState.type === 'resize-start') {
        let newStart = wrapMinutes(dragState.originStart + snapMinutes(delta));
        const span = spanBetween(newStart, dragState.originEnd);
        if (span < 10) newStart = wrapMinutes(dragState.originEnd - 10);
        updateZoneLive(dragState.zoneId, { startMinutes: newStart });
      } else if (dragState.type === 'resize-end') {
        let newEnd = wrapMinutes(dragState.originEnd + snapMinutes(delta));
        const span = spanBetween(dragState.originStart, newEnd);
        if (span < 10) newEnd = wrapMinutes(dragState.originStart + 10);
        updateZoneLive(dragState.zoneId, { endMinutes: newEnd });
      }

      if (moved && !dragState.moved) {
        setDragState((prev) => (prev ? { ...prev, moved: true } : prev));
      }
    };

    const handleUp = () => {
      setZones((current) => {
        const draggedZone = current.find((z) => z.id === dragState.zoneId);
        let finalZones = current;

        if (draggedZone && dragState.type === 'move') {
          const delay = shortestDelta(dragState.originStart, draggedZone.startMinutes);
          const result = runDominoShift(current, dragState.zoneId, delay);
          finalZones = result.updatedZones;
          if (result.affected.length > 0 || result.conflicts.length > 0) {
            setDominoReport(result);
          }
        } else if (draggedZone && (dragState.type === 'resize-start' || dragState.type === 'resize-end')) {
          const conflicts = detectConflicts(current);
          if (conflicts.length > 0) {
            setDominoReport({
              updatedZones: current,
              shiftedZoneId: dragState.zoneId,
              triggerDelay: 0,
              affected: [],
              conflicts,
              stressScore: 0,
              biologicalCost: 0,
            });
          }
        }

        saveZones(finalZones);
        return finalZones;
      });

      const wasClick = !dragState.moved;
      const clickedZoneId = dragState.zoneId;
      setDragState(null);
      if (wasClick) setEditingZoneId(clickedZoneId);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState, updateZoneLive]);

  const handleAddZone = () => {
    const id = `zone-${Date.now()}`;
    const newZone: TimeZoneItem = {
      id,
      title: 'New Zone',
      description: '',
      icon: '🎯',
      color: COLOR_PRESETS[zones.length % COLOR_PRESETS.length],
      startMinutes: snapMinutes(nowMinutes),
      endMinutes: snapMinutes(nowMinutes + 60),
      elasticity: 0.5,
      priority: 'OPTIMAL',
    };
    persistZones([...zones, newZone]);
    setEditingZoneId(id);
  };

  const handleSaveZone = (updated: TimeZoneItem) => {
    persistZones(zones.map((z) => (z.id === updated.id ? updated : z)));
    setEditingZoneId(null);
  };

  const handleDeleteZone = (id: string) => {
    persistZones(zones.filter((z) => z.id !== id));
    setEditingZoneId(null);
  };

  const editingZone = zones.find((z) => z.id === editingZoneId) || null;
  const accentColor = currentZone?.color || '#8b5cf6';
  const panelBg = darkMode
    ? 'bg-gradient-to-br from-[#0b0d14] via-[#0d0f18] to-[#0a0b11] border-white/[0.08]'
    : 'bg-gradient-to-br from-white via-white to-slate-50 border-black/[0.06]';
  const textMuted = darkMode ? 'text-white/45' : 'text-gray-500';

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border p-6 sm:p-10 transition-colors duration-500 ${panelBg}`}
      style={{
        boxShadow: darkMode
          ? '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 30px 80px -20px rgba(0,0,0,0.6)'
          : '0 1px 0 0 rgba(255,255,255,0.8) inset, 0 30px 80px -30px rgba(15,23,42,0.15)',
      }}
    >
      {/* ambient mesh glow, tinted by whatever zone is active right now */}
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 15% 10%, ${hexToRgba(accentColor, darkMode ? 0.16 : 0.09)}, transparent 42%), radial-gradient(circle at 85% 90%, ${hexToRgba(shadeColor(accentColor, 25), darkMode ? 0.12 : 0.06)}, transparent 46%)`,
        }}
      />

      <div className="relative">
        {/* HEADER */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: accentColor }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: accentColor }} />
              </span>
              <span className={`text-[10px] font-semibold tracking-[0.18em] uppercase ${textMuted}`}>Live</span>
            </div>
            <h2 className={`text-2xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Time Ring
            </h2>
            <p className={`text-sm mt-1 ${textMuted}`}>Your entire day, mapped onto a single circle</p>
          </div>
          <motion.button
            onClick={handleAddZone}
            whileHover={{ scale: 1.035, y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${shadeColor(accentColor, -15)})`,
              boxShadow: `0 8px 24px -8px ${hexToRgba(accentColor, 0.6)}`,
            }}
          >
            <Plus className="h-4 w-4" /> Add Zone
          </motion.button>
        </div>

        <AnimatePresence>
          {dominoReport && (
            <DominoReportPanel
              report={dominoReport}
              zones={zones}
              darkMode={darkMode}
              onDismiss={() => setDominoReport(null)}
            />
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-10 items-center">
          {/* RING */}
          <div className="mx-auto w-full max-w-[420px] select-none">
            <svg ref={svgRef} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="w-full h-auto touch-none overflow-visible">
              <defs>
                {sortedZones.map((zone) => (
                  <linearGradient key={zone.id} id={`zoneFill-${zone.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={shadeColor(zone.color, 12)} />
                    <stop offset="100%" stopColor={shadeColor(zone.color, -12)} />
                  </linearGradient>
                ))}
                <radialGradient id="hubGradient" cx="50%" cy="42%" r="65%">
                  <stop offset="0%" stopColor={darkMode ? '#1a1d29' : '#ffffff'} />
                  <stop offset="100%" stopColor={darkMode ? '#0c0d13' : '#f1f5f9'} />
                </radialGradient>
                <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="7" />
                </filter>
                <filter id="chaosDistort" x="-40%" y="-40%" width="180%" height="180%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>

              {/* hour ticks */}
              {Array.from({ length: 24 }).map((_, h) => {
                const angle = minutesToAngle(h * 60);
                const isMajor = h % 6 === 0;
                const outer = polarPoint(angle, OUTER_RADIUS + 9);
                const inner = polarPoint(angle, OUTER_RADIUS + (isMajor ? 1 : 5));
                return (
                  <line
                    key={h}
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                    strokeWidth={isMajor ? 2 : 1}
                    strokeLinecap="round"
                    className={darkMode ? (isMajor ? 'stroke-white/35' : 'stroke-white/15') : isMajor ? 'stroke-black/25' : 'stroke-black/10'}
                  />
                );
              })}

              {/* hour labels: 12AM, 6AM, 12PM, 6PM */}
              {[0, 6, 12, 18].map((h) => {
                const angle = minutesToAngle(h * 60);
                const pos = polarPoint(angle, OUTER_RADIUS + 27);
                const label = h === 0 ? '12AM' : h === 12 ? '12PM' : h < 12 ? `${h}AM` : `${h - 12}PM`;
                return (
                  <text
                    key={h}
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10.5"
                    fontWeight={700}
                    letterSpacing="0.5"
                    className={darkMode ? 'fill-white/35' : 'fill-black/25'}
                  >
                    {label}
                  </text>
                );
              })}

              {/* base ring track (grooved bezel effect) */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={OUTER_RADIUS - RING_THICKNESS / 2}
                fill="none"
                strokeWidth={RING_THICKNESS + 2}
                className={darkMode ? 'stroke-black/30' : 'stroke-black/[0.03]'}
              />
              <circle
                cx={CENTER}
                cy={CENTER}
                r={OUTER_RADIUS - RING_THICKNESS / 2}
                fill="none"
                strokeWidth={RING_THICKNESS}
                className={darkMode ? 'stroke-white/[0.04]' : 'stroke-black/[0.035]'}
              />

              {/* breathing glow behind the active zone */}
              {currentZone && (
                <motion.path
                  d={ringArcPath(currentZone.startMinutes, zoneSpanMinutes(currentZone), OUTER_RADIUS, RING_THICKNESS)}
                  fill={currentZone.color}
                  filter="url(#softGlow)"
                  animate={{ opacity: [0.35, 0.6, 0.35] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* zone arcs */}
              {sortedZones.map((zone, idx) => {
                const isCurrent = currentZone?.id === zone.id;
                const isHovered = hoveredZoneId === zone.id;
                const isDraggingThis = dragState?.zoneId === zone.id;
                const isUnstable = unstableIds.has(zone.id);
                const path = ringArcPath(zone.startMinutes, zoneSpanMinutes(zone), OUTER_RADIUS, RING_THICKNESS);
                const midAngle = minutesToAngle(zone.startMinutes + zoneSpanMinutes(zone) / 2);
                const labelPos = polarPoint(midAngle, OUTER_RADIUS - RING_THICKNESS / 2);
                const startHandlePos = polarPoint(minutesToAngle(zone.startMinutes), HANDLE_RADIUS);
                const endHandlePos = polarPoint(minutesToAngle(zone.endMinutes), HANDLE_RADIUS);
                const isActiveHandleSet = isHovered || isCurrent || isDraggingThis;

                return (
                  <g key={zone.id}>
                    <motion.path
                      d={path}
                      fill={`url(#zoneFill-${zone.id})`}
                      stroke={isUnstable ? '#EF4444' : darkMode ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.55)'}
                      strokeWidth={isUnstable ? 1.5 : 1}
                      strokeDasharray={isUnstable ? '3 4' : undefined}
                      initial={{ opacity: 0 }}
                      animate={
                        isUnstable
                          ? { opacity: [0.9, 0.55, 0.85, 0.4, 0.9] }
                          : { opacity: isCurrent ? 1 : isHovered ? 0.96 : 0.82 }
                      }
                      transition={
                        isUnstable
                          ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                          : { opacity: { duration: 0.4, delay: idx * 0.04 } }
                      }
                      style={{
                        cursor: isDraggingThis ? 'grabbing' : 'grab',
                        filter: isUnstable ? 'url(#chaosDistort)' : isCurrent ? `drop-shadow(0 4px 14px ${hexToRgba(zone.color, 0.45)})` : undefined,
                      }}
                      onPointerDown={(e) => handlePointerDownMove(e, zone)}
                      onPointerEnter={() => setHoveredZoneId(zone.id)}
                      onPointerLeave={() => setHoveredZoneId((id) => (id === zone.id ? null : id))}
                    />

                    {/* fracture lines — only for unstable zones */}
                    {isUnstable &&
                      [0.28, 0.52, 0.76].map((frac, ci) => {
                        const crackAngle = minutesToAngle(zone.startMinutes + zoneSpanMinutes(zone) * frac);
                        const from = polarPoint(crackAngle, OUTER_RADIUS - 2);
                        const to = polarPoint(crackAngle, OUTER_RADIUS - RING_THICKNESS + 2);
                        return (
                          <motion.line
                            key={ci}
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                            stroke="#FCA5A5"
                            strokeWidth={1}
                            className="pointer-events-none"
                            animate={{ opacity: [0, 0.9, 0] }}
                            transition={{ duration: 1.4 + ci * 0.3, repeat: Infinity, delay: ci * 0.4, ease: 'easeInOut' }}
                          />
                        );
                      })}

                    {/* icon chip on the arc */}
                    <circle
                      cx={labelPos.x}
                      cy={labelPos.y}
                      r={13}
                      className="pointer-events-none"
                      fill={darkMode ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.55)'}
                    />
                    <text
                      x={labelPos.x}
                      y={labelPos.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="15"
                      className="pointer-events-none"
                    >
                      {isUnstable ? '⚠️' : zone.icon}
                    </text>

                    {/* resize handles — two-tone with glow */}
                    {[
                      { pos: startHandlePos, which: 'resize-start' as const },
                      { pos: endHandlePos, which: 'resize-end' as const },
                    ].map(({ pos, which }) => (
                      <motion.g
                        key={which}
                        style={{ cursor: 'ew-resize' }}
                        onPointerDown={(e) => handlePointerDownHandle(e, zone, which)}
                        whileHover={{ scale: 1.25 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      >
                        {isActiveHandleSet && (
                          <circle cx={pos.x} cy={pos.y} r={11} fill={hexToRgba(zone.color, 0.25)} className="pointer-events-none" />
                        )}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={isActiveHandleSet ? 6.5 : 4.5}
                          fill={darkMode ? '#12141c' : '#ffffff'}
                          stroke={zone.color}
                          strokeWidth={2.5}
                        />
                      </motion.g>
                    ))}
                  </g>
                );
              })}

              {/* current time indicator */}
              <motion.g
                style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
                animate={{ rotate: nowAngle }}
                transition={{ type: 'tween', duration: 0.6, ease: 'easeOut' }}
              >
                <line
                  x1={CENTER}
                  y1={CENTER - (OUTER_RADIUS - RING_THICKNESS - 6)}
                  x2={CENTER}
                  y2={CENTER - (OUTER_RADIUS + 16)}
                  strokeWidth={2.5}
                  className={darkMode ? 'stroke-white' : 'stroke-gray-900'}
                  strokeLinecap="round"
                  filter="url(#softGlow)"
                  opacity={0.5}
                />
                <line
                  x1={CENTER}
                  y1={CENTER - (OUTER_RADIUS - RING_THICKNESS - 6)}
                  x2={CENTER}
                  y2={CENTER - (OUTER_RADIUS + 16)}
                  strokeWidth={2}
                  className={darkMode ? 'stroke-white' : 'stroke-gray-900'}
                  strokeLinecap="round"
                />
                <motion.circle
                  cx={CENTER}
                  cy={CENTER - (OUTER_RADIUS + 16)}
                  r={4.5}
                  className={darkMode ? 'fill-white' : 'fill-gray-900'}
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformOrigin: `${CENTER}px ${CENTER - (OUTER_RADIUS + 16)}px` }}
                />
              </motion.g>

              {/* center hub */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={OUTER_RADIUS - RING_THICKNESS - 12}
                fill="url(#hubGradient)"
                stroke={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                strokeWidth={1}
              />
              <text
                x={CENTER}
                y={CENTER - 12}
                textAnchor="middle"
                fontSize="30"
                fontWeight={700}
                letterSpacing="-0.5"
                fontFamily="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif"
                className={darkMode ? 'fill-white' : 'fill-gray-900'}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatClock(nowMinutes).split(' ')[0]}
              </text>
              <text
                x={CENTER}
                y={CENTER + 9}
                textAnchor="middle"
                fontSize="11"
                fontWeight={700}
                letterSpacing="2"
                className={darkMode ? 'fill-white/35' : 'fill-black/30'}
              >
                {formatClock(nowMinutes).split(' ')[1]}
              </text>
              {currentZone && (
                <>
                  <rect
                    x={CENTER - 58}
                    y={CENTER + 20}
                    width={116}
                    height={22}
                    rx={11}
                    fill={hexToRgba(currentZone.color, darkMode ? 0.18 : 0.12)}
                  />
                  <text x={CENTER} y={CENTER + 34} textAnchor="middle" fontSize="11.5" fontWeight={600} className={darkMode ? 'fill-white/85' : 'fill-gray-800'}>
                    {currentZone.icon} {currentZone.title}
                  </text>
                </>
              )}
            </svg>
          </div>

          {/* SIDE STATS */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <StatTile darkMode={darkMode} icon={<Sparkles className="h-3.5 w-3.5" />} accent={accentColor} label="Current Zone" value={currentZone ? `${currentZone.icon} ${currentZone.title}` : '—'} />
              <StatTile darkMode={darkMode} icon={<ClockIcon className="h-3.5 w-3.5" />} accent={accentColor} label="Time Remaining" value={timeRemaining !== null ? formatDuration(timeRemaining) : '—'} />
              <StatTile darkMode={darkMode} icon={<Flame className="h-3.5 w-3.5" />} accent={accentColor} label="Today's Progress" value={`${todayProgress}%`} />
              <StatTile darkMode={darkMode} icon={<Layers className="h-3.5 w-3.5" />} accent={accentColor} label="Total Zones" value={`${zones.length}`} />
            </div>

            <div className="space-y-2">
              {sortedZones.map((zone, idx) => {
                const isCurrent = currentZone?.id === zone.id;
                const isUnstable = unstableIds.has(zone.id);
                const todayStatus = checkIns[todayKey]?.[zone.id];
                return (
                  <motion.div
                    key={zone.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.04 }}
                    whileHover={{ x: 3 }}
                    className="w-full flex items-center gap-3 pl-2.5 pr-3.5 py-2.5 rounded-2xl text-left transition-colors relative overflow-hidden cursor-pointer"
                    style={{
                      backgroundColor: isCurrent ? hexToRgba(zone.color, darkMode ? 0.14 : 0.08) : darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                      boxShadow: isUnstable ? '0 0 0 1px rgba(239,68,68,0.35) inset' : undefined,
                    }}
                    onClick={() => setEditingZoneId(zone.id)}
                  >
                    <span className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: isUnstable ? '#EF4444' : zone.color, boxShadow: isCurrent ? `0 0 10px ${zone.color}` : undefined }} />
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: hexToRgba(zone.color, darkMode ? 0.18 : 0.12) }}
                    >
                      {isUnstable ? '⚠️' : zone.icon}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`flex items-center gap-1.5 text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {zone.title}
                        {isCurrent && (
                          <span
                            className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: zone.color, color: '#fff' }}
                          >
                            Now
                          </span>
                        )}
                        {isUnstable && (
                          <span className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 bg-red-500/15 text-red-500">
                            Unstable
                          </span>
                        )}
                      </span>
                      <span className={`block text-xs mt-0.5 ${textMuted}`}>
                        {formatClock(zone.startMinutes)} – {formatClock(zone.endMinutes)} · {formatDuration(zoneSpanMinutes(zone))}
                      </span>
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0 hidden sm:inline-block"
                      style={{ backgroundColor: hexToRgba(PRIORITY_META[zone.priority].color, 0.15), color: PRIORITY_META[zone.priority].color }}
                    >
                      {PRIORITY_META[zone.priority].label}
                    </span>
                    <span className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        title="Mark today done"
                        onClick={() => toggleCheckIn(zone.id, true)}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: todayStatus === true ? '#10B981' : darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                          color: todayStatus === true ? '#fff' : darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
                        }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Mark today skipped"
                        onClick={() => toggleCheckIn(zone.id, false)}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: todayStatus === false ? '#EF4444' : darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                          color: todayStatus === false ? '#fff' : darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </motion.div>
                );
              })}
              {zones.length === 0 && (
                <div className={`text-sm text-center py-8 rounded-2xl ${darkMode ? 'bg-white/[0.02]' : 'bg-black/[0.02]'} ${textMuted}`}>
                  No zones yet — tap "Add Zone" to map out your day.
                </div>
              )}
            </div>

            <div className={`flex items-start gap-2.5 text-xs rounded-2xl p-3.5 ${darkMode ? 'bg-white/[0.03] text-white/45' : 'bg-black/[0.025] text-gray-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <ClockIcon className="h-3.5 w-3.5" />
              </span>
              <span className="leading-relaxed pt-0.5">
                Drag a zone to move it, drag its end dots to resize. Everything snaps to the nearest 5 minutes and saves automatically in this browser.
              </span>
            </div>
          </div>
        </div>

        <ChaosHorizonPanel
          darkMode={darkMode}
          stabilityScore={stabilityScore}
          unstableZones={unstableZones}
          currentZone={currentZone}
          focusDecay={focusDecay}
          sleepDebt={sleepDebt}
          energyForecast={energyForecast}
          nowHour={nowMinutes / 60}
        />
      </div>

      <AnimatePresence>
        {editingZone && (
          <ZoneEditorModal
            zone={editingZone}
            darkMode={darkMode}
            onSave={handleSaveZone}
            onDelete={handleDeleteZone}
            onClose={() => setEditingZoneId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatTile({
  darkMode,
  label,
  value,
  icon,
  accent,
}: {
  darkMode: boolean;
  label: string;
  value: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div
      className={`rounded-2xl p-3.5 transition-transform hover:-translate-y-0.5 ${darkMode ? 'bg-white/[0.035]' : 'bg-black/[0.025]'}`}
      style={{ boxShadow: darkMode ? '0 1px 0 0 rgba(255,255,255,0.04) inset' : '0 1px 0 0 rgba(255,255,255,0.6) inset' }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="flex items-center justify-center" style={{ color: accent }}>
          {icon}
        </span>
        <div className={`text-[11px] font-medium ${darkMode ? 'text-white/40' : 'text-gray-500'}`}>{label}</div>
      </div>
      <div className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</div>
    </div>
  );
}

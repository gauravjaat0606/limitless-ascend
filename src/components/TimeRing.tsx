import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Clock as ClockIcon, Check, Flame, Layers, Sparkles } from 'lucide-react';

/* ============================================================
   TYPES
   ============================================================ */
export interface TimeZoneItem {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  color: string; // hex
  startMinutes: number; // 0-1439, minutes since 12:00 AM
  endMinutes: number; // 0-1439 (exclusive); may be numerically < startMinutes to represent wrap past midnight
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
  { id: 'zone-sleep', title: 'Sleep', description: 'Wind down and recover.', icon: '🌙', color: '#6366F1', startMinutes: 0, endMinutes: 360 },
  { id: 'zone-deepwork', title: 'Deep Work', description: 'Focused, distraction-free effort.', icon: '🧠', color: '#06B6D4', startMinutes: 360, endMinutes: 720 },
  { id: 'zone-skills', title: 'Skill Building', description: 'Study, practice, and learn.', icon: '📘', color: '#10B981', startMinutes: 720, endMinutes: 1080 },
  { id: 'zone-personal', title: 'Personal Time', description: 'Family, rest, and life admin.', icon: '⚡', color: '#F97316', startMinutes: 1080, endMinutes: 1440 },
];

function loadZones(): TimeZoneItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ZONES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as TimeZoneItem[];
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
   MAIN TIME RING COMPONENT
   ============================================================ */
export default function TimeRing({ darkMode }: TimeRingProps) {
  const [zones, setZones] = useState<TimeZoneItem[]>(() => loadZones());
  const [now, setNow] = useState(() => new Date());
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
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
        saveZones(current);
        return current;
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
                      stroke={darkMode ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.55)'}
                      strokeWidth={1}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isCurrent ? 1 : isHovered ? 0.96 : 0.82 }}
                      transition={{ opacity: { duration: 0.4, delay: idx * 0.04 } }}
                      style={{
                        cursor: isDraggingThis ? 'grabbing' : 'grab',
                        filter: isCurrent ? `drop-shadow(0 4px 14px ${hexToRgba(zone.color, 0.45)})` : undefined,
                      }}
                      onPointerDown={(e) => handlePointerDownMove(e, zone)}
                      onPointerEnter={() => setHoveredZoneId(zone.id)}
                      onPointerLeave={() => setHoveredZoneId((id) => (id === zone.id ? null : id))}
                    />

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
                      {zone.icon}
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
                return (
                  <motion.button
                    key={zone.id}
                    onClick={() => setEditingZoneId(zone.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.04 }}
                    whileHover={{ x: 3 }}
                    className="w-full flex items-center gap-3 pl-2.5 pr-3.5 py-2.5 rounded-2xl text-left transition-colors relative overflow-hidden"
                    style={{
                      backgroundColor: isCurrent ? hexToRgba(zone.color, darkMode ? 0.14 : 0.08) : darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                    }}
                  >
                    <span className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: zone.color, boxShadow: isCurrent ? `0 0 10px ${zone.color}` : undefined }} />
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: hexToRgba(zone.color, darkMode ? 0.18 : 0.12) }}
                    >
                      {zone.icon}
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
                      </span>
                      <span className={`block text-xs mt-0.5 ${textMuted}`}>
                        {formatClock(zone.startMinutes)} – {formatClock(zone.endMinutes)} · {formatDuration(zoneSpanMinutes(zone))}
                      </span>
                    </span>
                  </motion.button>
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

# Quick Reference Card

## 🎯 How to Access & Record Data

### Opening the Dashboard
1. Open `dist/index.html` in any web browser
2. Works offline - no internet needed
3. Bookmark it for quick access!

### Recording Your First Activity

**Method: Click "Log Activity" button (top-right corner)**

```
┌─────────────────────────────────────┐
│  Log New Activity                   │
├─────────────────────────────────────┤
│  Date:     [2024-01-15]            │
│  Time:     [14:30]                 │
├─────────────────────────────────────┤
│  Category:                         │
│  [Study] [Fitness] [Mindfulness]   │
├─────────────────────────────────────┤
│  Activity: Deep Work Session       │
│  Duration: ████████░░░ 90 min      │
│  Notes:    (optional)              │
├─────────────────────────────────────┤
│         [Log Activity]             │
└─────────────────────────────────────┘
```

### Quick Actions

| Action | Location | What It Does |
|--------|----------|--------------|
| **Log Activity** | Header (purple button) | Open form to record new activity |
| **Dark Mode** | Header (sun/moon icon) | Toggle light/dark theme |
| **My Data** | Top panel | Switch to your real data |
| **Demo Data** | Top panel | View sample data |
| **Export** | Data Management | Download backup (JSON) |
| **Import** | Data Management | Restore from backup |
| **Clear All** | Data Management | Delete all activities |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close modal |
| `Tab` | Navigate form fields |
| `Enter` | Submit form (when focused) |

## 📊 Understanding the Dashboard

### KPI Cards (Top Row)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Study Time   │ │ Fitness Time │ │ Improvement  │ │ Total Time   │
│ 125 min/day  │ │ 52 min/day   │ │ 28.4%        │ │ 88 hours     │
│ ↑ +12.5%     │ │ ↑ +8.3%      │ │ ↑ +2.1%      │ │ ↑ +10.2%     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
   vs last period
```

### Filter Controls
```
Date Range:  [7 days] [30 days] [90 days]
Segment:     [All] [Weekday] [Weekend] [High] [Medium] [Low]
```
All charts update instantly when you change filters!

### Charts Overview

1. **Line Chart** - Shows daily study/fitness vs goals
2. **Bar Chart** - Last 14 days comparison
3. **Area Chart** - Cumulative 1% improvement
4. **Donut Charts** - Time distribution & top activities

### Data Table Features

**Sort** - Click column headers:
- Date & Time
- Category
- Duration
- Impact

**Filter** - Use controls above table:
- Search box (activity names/notes)
- Category dropdown (Study/Fitness/Mindfulness)

## 💾 Data Management

### Where Your Data Lives
```
Your Browser (localStorage)
    ↓
    ├─ Activities (all logged items)
    ├─ Preferences (theme, dismissed banners)
    └─ Last Updated timestamp
```

### Backup Strategy (Recommended)

**Weekly**: Export your data
```
1. Click "Export" button
2. Save JSON file: gaurav-analytics-2024-01-15.json
3. Store in cloud/external drive
```

**Monthly**: Verify backup
```
1. Check file opens correctly
2. Verify data count matches dashboard
```

### Transferring to New Device

**On Old Device:**
1. Click "Export"
2. Save file

**On New Device:**
1. Open dashboard
2. Click "Import"
3. Select exported file
4. Data appears instantly!

## 🎨 Customization

### Theme
- Light mode: Professional, high contrast
- Dark mode: Easy on eyes, battery-saving

### Date Ranges
- 7 days: Weekly review
- 30 days: Monthly trends
- 90 days: Quarterly analysis

### Segments
- **All**: Everything
- **Weekday**: Mon-Fri performance
- **Weekend**: Sat-Sun activities
- **High/Medium/Low**: Study performance levels

## 📱 Multi-Device Usage

### Same Browser
✅ Data persists automatically
✅ No sync needed

### Different Browsers/Devices
⚠️ Must export/import manually
🔄 Export → Transfer → Import

### Recommended Setup
```
Primary Device (Daily Use)
    ↓
Weekly Export to Cloud
    ↓
Import to Secondary Device (Optional)
```

## 🔢 Sample Daily Routine

**Morning** (7:00 AM)
```
Log: 45 min Gym Workout (Fitness)
```

**Afternoon** (2:00 PM)
```
Log: 120 min Deep Work Session (Study)
```

**Evening** (8:00 PM)
```
Log: 10 min Meditation (Mindfulness)
```

**Before Bed** (10:00 PM)
```
1. Review dashboard (7-day view)
2. Check trends (↑ or ↓)
3. Plan tomorrow
```

## 🎯 Goals & Targets

Default targets in dashboard:
- **Study**: 150 min/day
- **Fitness**: 60 min/day

Your actual goals may vary! The dashboard is flexible.

## ⚡ Pro Tips

1. **Log immediately** after activities (don't wait!)
2. **Use notes** for memorable sessions
3. **Review weekly** to spot patterns
4. **Export monthly** for backups
5. **Toggle demo mode** to see what's possible
6. **Dark mode** for evening sessions
7. **Search table** to find specific workouts/topics

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Data disappeared | Check Demo vs My Data toggle |
| Can't see charts | Log at least 2-3 activities first |
| Export not working | Check popup blocker settings |
| Dates wrong | Verify browser timezone |
| Slow performance | Clear old data, keep ~90 days |

## 📞 Data Recovery

**If you lose data:**
1. Check browser localStorage (Dev Tools → Application → localStorage)
2. Look for recent exports in Downloads folder
3. Import last known good backup

**Prevention:**
- Export weekly
- Name files with dates
- Store in 2+ locations

---

## One-Page Cheat Sheet

```
┌─────────────────────────────────────────────────┐
│  GAURAV'S 1% ANALYTICS DASHBOARD                │
├─────────────────────────────────────────────────┤
│  TO LOG ACTIVITY:                               │
│  1. Click "Log Activity" (top-right)            │
│  2. Fill form (category, activity, duration)    │
│  3. Click "Log Activity" button                 │
│                                                  │
│  TO VIEW YOUR DATA:                             │
│  1. Click "My Data" toggle (top)                │
│  2. Use filters (date range, segment)           │
│  3. Scroll through charts                       │
│                                                  │
│  TO BACKUP:                                     │
│  1. Click "Export" → Save file                  │
│                                                  │
│  TO RESTORE:                                    │
│  1. Click "Import" → Select file                │
│                                                  │
│  REMEMBER: 1.01^365 = 37.8x 💪                 │
└─────────────────────────────────────────────────┘
```

Happy tracking! 🚀

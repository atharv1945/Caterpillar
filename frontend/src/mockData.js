// Local mock data — mirrors the 8-table schema (operators, machines, tasks,
// telemetry, idle_events, task_checkpoints, safety_events, training_content).
// Field names are kept generic so a real API/model payload can drop in later
// with minimal changes on the screen side.

export const operators = [
  { operator_id: "OP001", name: "Ramesh Kumar", preferred_language: "en" },
  { operator_id: "OP002", name: "Suresh Yadav", preferred_language: "hi" },
];

export const machines = [
  { machine_id: "EXC001", machine_type: "Excavator 320" },
];

export const tasks = [
  {
    task_id: "T001",
    machine_id: "EXC001",
    operator_id: "OP001",
    task_name: "Excavation",
    zone: "Zone A",
    scheduled_start: "07:00",
    scheduled_end: "11:30",
    status: "NOW",
    progress_pct: 8,
    eta_min: 58,
    why: "Based on your current dig rate and today's ground conditions.",
  },
  {
    task_id: "T002",
    machine_id: "EXC001",
    operator_id: "OP001",
    task_name: "Trench Backfill",
    zone: "Zone B",
    scheduled_start: "12:00",
    scheduled_end: "14:00",
    status: "NEXT",
    progress_pct: 0,
    eta_min: 120,
    why: "Standard duration for this task type and zone.",
  },
  {
    task_id: "T003",
    machine_id: "EXC001",
    operator_id: "OP001",
    task_name: "Site Grading",
    zone: "Zone C",
    scheduled_start: "14:30",
    scheduled_end: "16:00",
    status: "LATER",
    progress_pct: 0,
    eta_min: 90,
    why: "Scheduled after backfill completes.",
  },
  {
    task_id: "T004",
    machine_id: "EXC001",
    operator_id: "OP001",
    task_name: "Safety Training — Trench Protocols",
    zone: "Training Hub",
    scheduled_start: "16:00",
    scheduled_end: "16:15",
    status: "LATER",
    progress_pct: 0,
    eta_min: 15,
    why: "Recommended based on today's idle pattern.",
  },
];

// "Golden" telemetry — the exact rows the demo plays back, in order.
export const telemetry = [
  { timestamp: "07:00", machine_id: "EXC001", operator_id: "OP001", task_id: "T001", engine_hours: 812.1, fuel_used_l: 0, load_cycles: 0, idling_time_min: 0, seatbelt_status: "FASTENED", proximity_alert: false, weather_condition: "Clear", ground_condition: "Dry", eta_min: 270 },
  { timestamp: "08:15", machine_id: "EXC001", operator_id: "OP001", task_id: "T001", engine_hours: 813.3, fuel_used_l: 18.2, load_cycles: 22, idling_time_min: 4, seatbelt_status: "FASTENED", proximity_alert: false, weather_condition: "Clear", ground_condition: "Dry", eta_min: 190 },
  { timestamp: "09:05", machine_id: "EXC001", operator_id: "OP001", task_id: "T001", engine_hours: 814.0, fuel_used_l: 26.8, load_cycles: 34, idling_time_min: 12, seatbelt_status: "FASTENED", proximity_alert: false, weather_condition: "Rain", ground_condition: "Muddy", eta_min: 95 },
  { timestamp: "09:40", machine_id: "EXC001", operator_id: "OP001", task_id: "T001", engine_hours: 814.5, fuel_used_l: 31.4, load_cycles: 41, idling_time_min: 12, seatbelt_status: "UNFASTENED", proximity_alert: true, weather_condition: "Rain", ground_condition: "Muddy", eta_min: 62 },
  { timestamp: "10:20", machine_id: "EXC001", operator_id: "OP001", task_id: "T001", engine_hours: 815.1, fuel_used_l: 36.0, load_cycles: 49, idling_time_min: 12, seatbelt_status: "FASTENED", proximity_alert: false, weather_condition: "Rain", ground_condition: "Muddy", eta_min: 47 },
];

export const idle_events = [
  {
    idle_event_id: "IDLE001",
    machine_id: "EXC001",
    operator_id: "OP001",
    task_id: "T001",
    idle_start: "08:58",
    idle_end: "09:10",
    duration_min: 12,
    idle_reason_code: null,
    reason_source: "SYSTEM_INFERRED",
  },
];

export const idle_reason_options = [
  { code: "WAITING_TRUCK", label: "Waiting Truck", icon: "truck" },
  { code: "WAITING_INSTRUCTIONS", label: "Waiting Instructions", icon: "clipboard" },
  { code: "MECHANICAL_ISSUE", label: "Mechanical Issue", icon: "wrench" },
  { code: "WEATHER", label: "Weather", icon: "cloud-rain" },
  { code: "BREAK", label: "Break", icon: "coffee" },
  { code: "OTHER", label: "Other", icon: "dots" },
];

export const task_checkpoints = [
  {
    task_id: "T001",
    checkpoint_time: "09:40",
    progress_pct: 68,
    cycles_completed: 41,
    notes: "Paused for shift changeover.",
    event_type: "PAUSE",
    operator_id: "OP001",
  },
  {
    task_id: "T001",
    checkpoint_time: "10:00",
    progress_pct: 68,
    cycles_completed: 41,
    notes: "Resuming after handover.",
    event_type: "RESUME",
    operator_id: "OP002",
  },
];

export const safety_events = [
  {
    event_id: "SAFE001",
    machine_id: "EXC001",
    operator_id: "OP001",
    timestamp: "09:40",
    event_type: "SEATBELT",
    severity: "CRITICAL",
    resolved: false,
    message: "Seatbelt unfastened while machine is active.",
    summary:
      "Seatbelt alert triggered at 09:40 during active excavation in Zone A. Operator was in the cabin with the machine running. Please confirm seatbelt is fastened before continuing.",
  },
];

// `category` groups these for the Training Center's category list. The two
// extra entries mirror what's already seeded in the backend's own
// training_content.csv (TR001/TR002) — surfacing existing data, not a new
// taxonomy.
export const training_content = [
  {
    content_id: "TRN001",
    title: "Trench Safety Protocols — 90 Second Refresher",
    category: "Safety",
    language: "en",
    video_url_or_path: "/training/trench-safety.mp4",
    duration_min: 2,
  },
  {
    content_id: "TR001",
    title: "Excavator Basics",
    category: "Excavator",
    language: "en",
    video_url_or_path: "/static/training/excavator_basics_en.mp4",
    duration_min: 3,
  },
  {
    content_id: "TR002",
    title: "Safety Guidelines",
    category: "Safety",
    language: "hi",
    video_url_or_path: "/static/training/safety_guidelines_hi.mp4",
    duration_min: 3,
  },
];

export const training_qa = [
  { from: "bob", text: "Ask me anything about today's task or site safety." },
  { from: "operator", text: "Why is the ground condition marked muddy?" },
  { from: "bob", text: "Rain since 9:00 AM softened the topsoil in Zone A. Reduce dig speed on the north slope." },
];

export const shift_summary = {
  stats: [
    { label: "Tasks Completed", value: "3", icon: "check", tone: "success" },
    { label: "Engine Hours", value: "3.1h", icon: "clock", tone: "info" },
    { label: "Load Cycles", value: "146", icon: "layers", tone: "info" },
    { label: "Idle Time", value: "12 min", icon: "pause", tone: "attention" },
  ],
  behavior_insight:
    "You idled for 5 minutes mid-morning while waiting on a truck — that's your only slowdown today, nice and controlled otherwise.",
  training_recommendation:
    "Take the 2-minute Trench Safety Protocols refresher before tomorrow's shift in Zone A.",
};

// Pre-scripted quick-questions for the global chat overlay — tappable,
// no live STT/API, same scripted-with-fallback spirit as everything else.
export const chat_quick_questions = [
  {
    id: "status",
    question: "What's my task status?",
    answer: null, // filled in live from current task state, with a hardcoded fallback
  },
  {
    id: "eta",
    question: "Why did my ETA change?",
    answer: "Rain since 9:00 AM softened the topsoil in Zone A, so each dig cycle now takes longer.",
  },
  {
    id: "safe",
    question: "Is everything safe right now?",
    answer: "Seatbelt and proximity checks are both clear right now. I'll interrupt you the moment that changes.",
  },
];

export const bob_captions = {
  greeting: "Good morning, Ramesh! Excavation in Zone A is up first today.",
  taskStart: "Starting Zone A excavation. I'll keep your ETA updated as you go.",
  idle: "You've been idle for 5 minutes. What's going on?",
  idleAck: "Got it — logged as waiting on the truck. I'll keep this in mind for tomorrow's plan.",
  etaChange: "Rain has made the ground muddy, so I've added time to your estimate.",
  critical: "Stop — your seatbelt is unfastened. Please fasten it now.",
  criticalAck: "Thanks for confirming. Stay safe out there.",
  handover: "Resuming Excavation in Zone A at 68% — right where you left off.",
  complete: "Nice work — Zone A excavation is complete with barely any idle time.",
  listening: "I'm listening...",
};

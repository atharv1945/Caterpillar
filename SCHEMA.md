# CAT Operator AI Companion - Data Schema

This document outlines the schema for the 8 CSV tables used in the backend of the CAT Operator AI Companion.
These tables act as the shared contract between Frontend, Backend, and ML teams.

## 1. operators.csv
Who's operating — greeting + language.
- `operator_id`: Unique identifier for the operator.
- `name`: Full name of the operator.
- `preferred_language`: Preferred language (e.g., English, Hindi).

## 2. machines.csv
Which machine, keeps IDs consistent.
- `machine_id`: Unique identifier for the machine.
- `machine_type`: Type of the machine (e.g., Excavator).

## 3. tasks.csv
Drives NOW/NEXT/LATER dashboard.
- `task_id`: Unique identifier for the task.
- `machine_id`: Machine assigned to the task.
- `operator_id`: Operator assigned to the task.
- `task_name`: Name/description of the task.
- `zone`: Location zone (e.g., Zone A).
- `scheduled_start`: Scheduled start time.
- `scheduled_end`: Scheduled end time.
- `status`: Current status (e.g., scheduled, in_progress, completed).

## 4. telemetry.csv
Core time-series; main feature source for both ML models (ETA and behavior/anomaly).
- `timestamp`: Time of the telemetry reading.
- `machine_id`: ID of the machine.
- `operator_id`: ID of the operator.
- `task_id`: ID of the current task.
- `engine_hours`: Cumulative engine hours.
- `fuel_used_l`: Fuel used in liters.
- `load_cycles`: Number of load cycles completed.
- `idling_time_min`: Current continuous idling time in minutes.
- `seatbelt_status`: Status of the seatbelt (fastened/unfastened).
- `proximity_alert`: Boolean indicating if a proximity hazard was detected.
- `weather_condition`: Current weather condition.
- `ground_condition`: Current ground condition.
- `is_golden`: Boolean indicating if this is a golden row for the live demo sequence (TRUE) or a training row (FALSE).

## 5. idle_events.csv
Powers "Why Are You Waiting?"; feeds behavior model.
- `idle_event_id`: Unique identifier for the idle event.
- `machine_id`: ID of the machine.
- `operator_id`: ID of the operator.
- `task_id`: ID of the task.
- `idle_start`: Start time of the idle event.
- `idle_end`: End time of the idle event.
- `duration_min`: Duration of the idle event in minutes.
- `idle_reason_code`: Code for the idle reason (e.g., waiting_truck).
- `reason_source`: Source of the reason (e.g., operator, system).

## 6. task_checkpoints.csv
Powers "Remember Where I Left Off".
- `task_id`: ID of the task.
- `checkpoint_time`: Time the checkpoint was saved.
- `progress_pct`: Percentage of progress completed.
- `cycles_completed`: Number of cycles completed at the checkpoint.
- `notes`: Any notes saved by the operator or system.
- `event_type`: Type of event (e.g., pause, resume).
- `operator_id`: ID of the operator.

## 7. safety_events.csv
Powers seatbelt/proximity alert + incident summary.
- `event_id`: Unique identifier for the safety event.
- `machine_id`: ID of the machine.
- `operator_id`: ID of the operator.
- `timestamp`: Time the safety event occurred.
- `event_type`: Type of safety event (e.g., seatbelt_unfastened).
- `severity`: Severity level (e.g., high, medium, low).
- `resolved`: Boolean indicating if the event has been resolved.

## 8. training_content.csv
Powers training hub.
- `content_id`: Unique identifier for the training content.
- `title`: Title of the video/lesson.
- `language`: Language of the content.
- `video_url_or_path`: URL or local static path to the video file.

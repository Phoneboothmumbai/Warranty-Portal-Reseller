import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, Clock } from "lucide-react";

/**
 * DateDurationInput - Dual mode input for Date OR Duration
 * 
 * Props:
 * - startDate: The start date (required for duration calculation)
 * - endDate: The current end date value
 * - onEndDateChange: Callback when end date changes
 * - mode: 'date' | 'duration' (controlled mode)
 * - onModeChange: Callback when mode changes
 * - defaultMode: Default mode if uncontrolled
 * - durationUnits: Array of {id, name, multiplier} - defaults to Days/Months/Years
 * - label: Optional label
 * - disabled: Disable the input
 * - className: Additional classes
 * - showCalculatedDate: Show the calculated end date when in duration mode (default: true)
 */
const DEFAULT_DURATION_UNITS = [
  { id: "days", name: "Days", multiplier: 1 },
  { id: "months", name: "Months", multiplier: 30 },
  { id: "years", name: "Years", multiplier: 365 },
];

const DateDurationInput = React.forwardRef((
  {
    startDate,
    endDate,
    onEndDateChange,
    mode: controlledMode,
    onModeChange,
    defaultMode = "date",
    durationUnits = DEFAULT_DURATION_UNITS,
    label,
    disabled = false,
    className,
    showCalculatedDate = true,
    required = false,
    ...props
  },
  ref
) => {
  const [internalMode, setInternalMode] = React.useState(defaultMode);
  const [durationValue, setDurationValue] = React.useState("");
  const [durationUnit, setDurationUnit] = React.useState("years");

  const mode = controlledMode ?? internalMode;

  const handleModeChange = (newMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  // Calculate end date from duration
  const calculateEndDate = React.useCallback((start, value, unit) => {
    if (!start || !value) return null;
    
    const startDateObj = new Date(start);
    const numValue = parseInt(value, 10);
    
    if (isNaN(numValue) || numValue <= 0) return null;

    let endDateObj;
    
    switch (unit) {
      case "days":
        endDateObj = new Date(startDateObj);
        endDateObj.setDate(endDateObj.getDate() + numValue);
        break;
      case "months":
        endDateObj = new Date(startDateObj);
        endDateObj.setMonth(endDateObj.getMonth() + numValue);
        break;
      case "years":
        endDateObj = new Date(startDateObj);
        endDateObj.setFullYear(endDateObj.getFullYear() + numValue);
        break;
      default:
        return null;
    }

    return endDateObj.toISOString().split("T")[0];
  }, []);

  // Update end date when duration changes
  React.useEffect(() => {
    if (mode === "duration" && startDate && durationValue) {
      const calculatedDate = calculateEndDate(startDate, durationValue, durationUnit);
      if (calculatedDate && calculatedDate !== endDate) {
        onEndDateChange?.(calculatedDate);
      }
    }
  }, [mode, startDate, durationValue, durationUnit, calculateEndDate, onEndDateChange, endDate]);

  // Parse existing end date to duration when switching to duration mode
  React.useEffect(() => {
    if (mode === "duration" && startDate && endDate && !durationValue) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 365 && diffDays % 365 === 0) {
        setDurationValue(String(Math.round(diffDays / 365)));
        setDurationUnit("years");
      } else if (diffDays >= 30 && diffDays % 30 === 0) {
        setDurationValue(String(Math.round(diffDays / 30)));
        setDurationUnit("months");
      } else {
        setDurationValue(String(diffDays));
        setDurationUnit("days");
      }
    }
  }, [mode, startDate, endDate]);

  const handleDirectDateChange = (e) => {
    onEndDateChange?.(e.target.value);
  };

  const handleDurationValueChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setDurationValue(val);
  };

  const handleDurationUnitChange = (e) => {
    setDurationUnit(e.target.value);
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div ref={ref} className={cn("space-y-3", className)} {...props}>
      {label && (
        <Label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      {/* Mode Toggle */}
      <RadioGroup
        value={mode}
        onValueChange={handleModeChange}
        className="flex gap-4"
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="date" id="mode-date" />
          <Label htmlFor="mode-date" className="flex items-center gap-1.5 cursor-pointer text-sm">
            <Calendar className="h-3.5 w-3.5" />
            End Date
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="duration" id="mode-duration" />
          <Label htmlFor="mode-duration" className="flex items-center gap-1.5 cursor-pointer text-sm">
            <Clock className="h-3.5 w-3.5" />
            Duration
          </Label>
        </div>
      </RadioGroup>

      {/* Input Fields */}
      {mode === "date" ? (
        <Input
          type="date"
          value={endDate || ""}
          onChange={handleDirectDateChange}
          disabled={disabled}
          className="form-input"
          min={startDate}
          required={required}
        />
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={durationValue}
              onChange={handleDurationValueChange}
              disabled={disabled || !startDate}
              placeholder={!startDate ? "Set start date first" : "Enter duration"}
              className="form-input flex-1"
              required={required}
            />
            <select
              value={durationUnit}
              onChange={handleDurationUnitChange}
              disabled={disabled || !startDate}
              className="form-select w-28"
            >
              {durationUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Calculated Date Display */}
          {showCalculatedDate && endDate && startDate && (
            <p className="text-sm text-slate-600">
              Coverage ends on:{" "}
              <span className="font-medium text-slate-900">
                {formatDisplayDate(endDate)}
              </span>
            </p>
          )}
          
          {!startDate && (
            <p className="text-xs text-amber-600">
              Please set a start date to calculate duration
            </p>
          )}
        </div>
      )}
    </div>
  );
});

DateDurationInput.displayName = "DateDurationInput";

export { DateDurationInput, DEFAULT_DURATION_UNITS };

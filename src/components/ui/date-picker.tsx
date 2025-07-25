
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  id?: string;
  onSelect: (date: Date | undefined) => void;
  selected?: Date;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * DatePicker component for selecting dates
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  id,
  onSelect,
  selected,
  placeholder = "Pick a date",
  disabled = false,
  className,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
};

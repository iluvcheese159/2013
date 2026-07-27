import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import PRINTER_MODELS from "@/constants/printerModels";

export default function PrinterModelSelector({ value, onChange, className }) {
  const [open, setOpen] = useState(false);
  const selected = PRINTER_MODELS.find((m) => m.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-tech rounded-xl text-xs uppercase tracking-wider", className)}
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <img src={selected.image} alt={selected.name} className="h-5 w-5 rounded-lg object-cover" />
              {selected.name}
            </span>
          ) : (
            <span className="text-muted-foreground">Select a printer model</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="max-h-[240px] overflow-y-auto">
          {PRINTER_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                onChange(model.id === value ? "" : model.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent/10 transition-colors",
                value === model.id && "bg-accent/10"
              )}
            >
              <img src={model.image} alt={model.name} className="h-8 w-8 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{model.name}</div>
                <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">{model.provider}</div>
              </div>
              {value === model.id && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
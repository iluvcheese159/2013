import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, SlidersHorizontal, Sparkles } from "lucide-react";

const MATERIAL_PRESETS = [
  { name: "Matte Plastic", roughness: 0.8, metalness: 0.0 },
  { name: "Glossy Plastic", roughness: 0.3, metalness: 0.0 },
  { name: "Brushed Metal", roughness: 0.5, metalness: 0.8 },
  { name: "Polished Metal", roughness: 0.1, metalness: 0.95 },
  { name: "Wood", roughness: 0.7, metalness: 0.0 },
  { name: "Carbon Fiber", roughness: 0.3, metalness: 0.1 },
  { name: "Glass", roughness: 0.05, metalness: 0.1 },
  { name: "Rubber", roughness: 0.9, metalness: 0.0 },
];

export function TeaserUI({ selected, onMaterialChange, onColorChange }) {
  const [activePreset, setActivePreset] = useState(null);

  const handlePresetSelect = (preset) => {
    setActivePreset(preset);
    if (selected) {
      onMaterialChange("roughness", preset.roughness);
      onMaterialChange("metalness", preset.metalness);
    }
  };

  if (!selected) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Material Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {MATERIAL_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                className={`p-2 rounded-lg border text-xs font-tech uppercase tracking-wider transition-all ${
                  activePreset?.name === preset.name
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Material Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-tech uppercase tracking-wider mb-2">
              Roughness: {(selected.roughness ?? 0.45).toFixed(2)}
            </Label>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[selected.roughness ?? 0.45]}
              onValueChange={(v) => onMaterialChange("roughness", v[0])}
            />
          </div>

          <div>
            <Label className="text-xs font-tech uppercase tracking-wider mb-2">
              Metalness: {(selected.metalness ?? 0.08).toFixed(2)}
            </Label>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[selected.metalness ?? 0.08]}
              onValueChange={(v) => onMaterialChange("metalness", v[0])}
            />
          </div>

          <div>
            <Label className="text-xs font-tech uppercase tracking-wider mb-2">
              Color
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selected.color || "#f59e0b"}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-12 h-8 p-1 border border-border rounded"
              />
              <span className="text-sm font-tech">
                {selected.color || "#f59e0b"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-border">
        <CardContent className="pt-4">
          <div className="text-xs font-tech text-center text-muted-foreground">
            <Palette className="h-3 w-3 inline mr-1" />
            Tip: Lower roughness + higher metalness = shiny metal. Higher roughness = matte finish.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
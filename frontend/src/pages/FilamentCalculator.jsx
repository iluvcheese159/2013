import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Calculator, Clock, CircleDollarSign, Droplet, Flame, Home, Package, Zap } from "lucide-react";
import { toast } from "sonner";

export default function FilamentCalculator() {
  const [formData, setFormData] = useState({
    model_volume: 100,
    material: "PLA",
    cost_per_kg: 20,
    infill_percentage: 20,
    wall_line_count: 3,
    wall_thickness_mm: 0.4,
    top_bottom_layers: 4,
    layer_height_mm: 0.2,
    nozzle_diameter_mm: 0.4,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const materialDensities = {
    PLA: 1.24,
    ABS: 1.04,
    PETG: 1.27,
    TPU: 1.21,
    Nylon: 1.14,
    "PLA+": 1.25,
    "ASA": 1.07,
    "PC": 1.20,
  };

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await api.post("/filament/calculate", formData);
      setResult(response.data);
    } catch (error) {
      console.warn("Calculation error:", error);
      toast.error("Calculation failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFormData({
      model_volume: 100,
      material: "PLA",
      cost_per_kg: 20,
      infill_percentage: 20,
      wall_line_count: 3,
      wall_thickness_mm: 0.4,
      top_bottom_layers: 4,
      layer_height_mm: 0.2,
      nozzle_diameter_mm: 0.4,
    });
    setResult(null);
  };

  if (!result) return (
    <div className="pt-14 min-h-screen">
      <div className="border-b border-border px-6 md:px-12 lg:px-24 py-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3 rise-in">
              <span className="text-primary">●</span> Filament Calculator
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-light tracking-tighter rise-in rise-in-1">Estimate your print costs.</h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl rise-in rise-in-2">
              Calculate material usage, print time, and cost before you start printing. Get accurate estimates based on your model volume and print settings.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-10 space-y-8">
        <Card className="w-full max-w-xl mx-auto rise-in rise-in-2 auto-float">
          <CardHeader className="pb-4">
            <Calculator className="h-5 w-5 mb-2" />
            <CardTitle className="font-display text-2xl">Filament Usage & Cost Calculator</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter your model specifications to estimate material usage and print cost
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Model Volume (cm³)</Label>
              <Input
                type="number"
                value={formData.model_volume}
                onChange={(e) => setFormData({ ...formData, model_volume: parseFloat(e.target.value) || 0 })}
                min="0.1"
                step="0.1"
                placeholder="Enter model volume in cubic centimeters"
                className="w-full font-tech rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Filament Material</Label>
                <select
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-sm font-tech"
                >
                  {Object.entries(materialDensities).map(([mat, density]) => (
                    <option key={mat} value={mat}>
                      {mat} ({density}g/cm³)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Filament Cost ($/kg)</Label>
                <Input
                  type="number"
                  value={formData.cost_per_kg}
                  onChange={(e) => setFormData({ ...formData, cost_per_kg: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.5"
                  placeholder="Cost per kilogram of filament"
                  className="w-full font-tech rounded-xl"
                />
              </div>
            </div>

            <button onClick={calculate} disabled={loading} className="w-full rounded-xl font-tech text-xs uppercase tracking-wider py-3 auto-glow-pulse">
              {loading ? "Calculating..." : "Calculate Cost & Usage"}
            </button>
          </CardContent>
        </Card>

        {result && (
          <Card className="w-full max-w-xl mx-auto rise-in rise-in-3 auto-glow-pulse">
            <CardHeader className="pb-4">
              <Activity className="h-5 w-5 mb-2" />
              <CardTitle className="font-display text-2xl">Calculation Results</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Estimated material usage and cost for your print
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-volume">Filament Usage</div>
                  <div className="flex flex-col">
                    <div className="text-2xl font-display font-bold">{result.total_volume_cm3.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">cm³ ({result.total_volume_cm3 * (formData.density || 1.24) / 1000} kg)</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">Print Time Estimate</div>
                  <div className="flex flex-col">
                    <div className="text-2xl font-display font-bold">{result.hours_estimate.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">hours ({Math.round(result.hours_estimate * 60)} minutes)</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="text-sm font-medium text-muted-foreground mb-3">Cost Breakdown</div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Filament Cost</span>
                    <span className="text-2xl font-display font-bold">${result.cost_estimate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Electricity Cost</span>
                    <span className="text-2xl font-display font-bold">${(result.hours_estimate * 0.15).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3">
                    <span className="text-sm font-medium font-semibold">Total Estimated Cost</span>
                    <span className="text-2xl font-display font-bold text-primary">
                      ${(result.cost_estimate + result.hours_estimate * 0.15).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
import { useState } from "react";
import { useCreateScenario } from "@/lib/finance.ts";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  monthlyIncome: z.number().min(0),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = { open: boolean; onClose: () => void };

export default function NewScenarioDialog({ open, onClose }: Props) {
  const createScenario = useCreateScenario();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { monthlyIncome: 0 },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createScenario.mutateAsync({ name: data.name, monthly_income: data.monthlyIncome, notes: data.notes || null });
      toast.success(`Scenario "${data.name}" created!`);
      reset();
      onClose();
    } catch {
      toast.error("Failed to create scenario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Budget Scenario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Scenario Name</Label>
            <Input {...register("name")} placeholder="e.g. Salary Option A, Side Hustle, Lean Budget" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Monthly Take-Home Income</Label>
            <Input {...register("monthlyIncome", { valueAsNumber: true })} type="number" step="0.01" placeholder="0.00" />
            {errors.monthlyIncome && <p className="text-xs text-destructive">{errors.monthlyIncome.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea {...register("notes")} placeholder="e.g. Based on $90k salary, post-tax" rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Scenario"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

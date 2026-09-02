import { useState } from "react";
import { useUpsertBudgetItem } from "@/lib/finance.ts";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";

const CATEGORIES = ["housing", "transport", "food", "health", "entertainment", "savings", "investment", "side hustle", "other"];

const schema = z.object({
  label: z.string().min(1, "Label is required"),
  amount: z.number().min(0),
  type: z.union([z.literal("income"), z.literal("expense")]),
  category: z.string().min(1),
  frequency: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  scenarioId: string;
};

export default function AddBudgetItemDialog({ open, onClose, scenarioId }: Props) {
  const upsertItem = useUpsertBudgetItem();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "expense", category: "other", frequency: "monthly", amount: 0 },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await upsertItem.mutateAsync({ scenario_id: scenarioId, ...data });
      toast.success("Item added!");
      reset({ type: "expense", category: "other", frequency: "monthly", amount: 0 });
      onClose();
    } catch {
      toast.error("Failed to add item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Budget Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Label</Label>
            <Input {...register("label")} placeholder="e.g. Netflix, Gym, Car insurance" />
            {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={watch("type")} onValueChange={(v) => setValue("type", v as "income" | "expense")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select value={watch("frequency")} onValueChange={(v) => setValue("frequency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input {...register("amount", { valueAsNumber: true })} type="number" step="0.01" placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Item"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

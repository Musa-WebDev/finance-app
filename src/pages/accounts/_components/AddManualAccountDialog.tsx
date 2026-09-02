import { useState } from "react";
import { useCreateAccount } from "@/lib/finance.ts";
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

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1),
  balance: z.number(),
  institution: z.string().optional(),
  currency: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = { open: boolean; onClose: () => void };

export default function AddManualAccountDialog({ open, onClose }: Props) {
  const createAccount = useCreateAccount();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "checking", currency: "USD", balance: 0 },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createAccount.mutateAsync({ ...data, institution: data.institution || null, currency: data.currency || "USD" });
      toast.success("Account added!");
      reset();
      onClose();
    } catch {
      toast.error("Failed to add account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Account Manually</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Account Name</Label>
            <Input {...register("name")} placeholder="e.g. Chase Checking" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Account Type</Label>
            <Select value={watch("type")} onValueChange={(v) => setValue("type", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="credit">Credit Card</SelectItem>
                <SelectItem value="loan">Loan / Mortgage</SelectItem>
                <SelectItem value="investment">Investment / Brokerage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Current Balance</Label>
            <Input {...register("balance", { valueAsNumber: true })} type="number" step="0.01" placeholder="0.00" />
          </div>
          <div className="space-y-1.5">
            <Label>Institution (optional)</Label>
            <Input {...register("institution")} placeholder="e.g. Chase Bank" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Account"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useScenarios, useSetActiveScenario, useDeleteScenario, type BudgetScenario } from "@/lib/finance.ts";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Plus, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import NewScenarioDialog from "./NewScenarioDialog.tsx";
import ScenarioView from "./ScenarioView.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";
import { PieChart } from "lucide-react";

export default function BudgetInner() {
  const { data: scenarios, isLoading } = useScenarios();
  const setActive = useSetActiveScenario();
  const deleteScenario = useDeleteScenario();

  const [showNew, setShowNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeScenario =
    (selectedId ? scenarios?.find((s) => s.id === selectedId) : null) ??
    scenarios?.find((s) => s.is_active) ??
    scenarios?.[0] ??
    null;

  const handleSetActive = async (id: string) => {
    try {
      await setActive.mutateAsync(id);
      toast.success("Active scenario updated.");
    } catch {
      toast.error("Failed to update active scenario.");
    }
  };

  const handleDelete = async (s: BudgetScenario) => {
    try {
      await deleteScenario.mutateAsync(s.id);
      toast.success(`"${s.name}" deleted.`);
      setSelectedId(null);
    } catch {
      toast.error("Failed to delete scenario.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budget Planner</h1>
          <p className="text-muted-foreground text-sm">
            Plan multiple salary scenarios and visualize your monthly cash flow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {scenarios.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-1.5">
                  {activeScenario?.name ?? "Select scenario"}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {scenarios.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate">{s.name}</span>
                    {s.is_active && (
                      <span className="text-xs text-accent font-medium ml-2">Active</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Scenario
          </Button>
        </div>
      </div>

      {/* Content */}
      {scenarios.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PieChart />
            </EmptyMedia>
            <EmptyTitle>No budget scenarios yet</EmptyTitle>
            <EmptyDescription>
              Create a scenario to plan your income, expenses, and monthly cash flow for different salary situations.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create First Scenario
            </Button>
          </EmptyContent>
        </Empty>
      ) : activeScenario ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScenario.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <ScenarioView
              scenario={activeScenario}
              onSetActive={() => handleSetActive(activeScenario.id)}
              onDelete={() => handleDelete(activeScenario)}
            />
          </motion.div>
        </AnimatePresence>
      ) : null}

      <NewScenarioDialog open={showNew} onClose={() => setShowNew(false)} />
    </div>
  );
}

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

const COLORS = [
  { id: "blue", hex: "#3B82F6", label: "Blue" },
  { id: "green", hex: "#22C55E", label: "Green" },
  { id: "red", hex: "#EF4444", label: "Red" },
  { id: "yellow", hex: "#F59E0B", label: "Yellow" },
  { id: "purple", hex: "#A855F7", label: "Purple" },
  { id: "pink", hex: "#EC4899", label: "Pink" },
];

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddCategoryModal({
  open,
  onClose,
  onCreated,
}: AddCategoryModalProps) {
  const { actor } = useAuth();
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (!actor) return;
    setLoading(true);
    try {
      await actor.createCategory({ name: name.trim(), color: selectedColor });
      toast.success("Category created!");
      setName("");
      setSelectedColor("blue");
      onCreated();
      onClose();
    } catch {
      toast.error("Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="add_category.dialog">
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Category Name</Label>
            <Input
              id="cat-name"
              placeholder="e.g. Contracts, Invoices, Reports"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              data-ocid="add_category.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedColor(c.id)}
                  className="h-7 w-7 rounded-full border-2 transition-all"
                  style={{
                    background: c.hex,
                    borderColor: selectedColor === c.id ? c.hex : "transparent",
                    boxShadow:
                      selectedColor === c.id
                        ? `0 0 0 2px white, 0 0 0 4px ${c.hex}`
                        : "none",
                  }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              data-ocid="add_category.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading}
              data-ocid="add_category.submit_button"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

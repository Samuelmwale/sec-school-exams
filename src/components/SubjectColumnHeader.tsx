import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Pencil, Trash2, Plus, ChevronDown, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { SchoolSubject } from "@/hooks/useSchoolSubjects";
import { toast } from "sonner";

interface SubjectColumnHeaderProps {
  subject: SchoolSubject;
  onUpdate: (id: string, name: string, abbreviation: string) => Promise<boolean>;
  onToggle: (id: string, isActive: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export const SubjectColumnHeader = ({
  subject,
  onUpdate,
  onToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: SubjectColumnHeaderProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(subject.name);
  const [abbreviation, setAbbreviation] = useState(subject.abbreviation);

  const handleSave = async () => {
    if (!name.trim() || !abbreviation.trim()) {
      toast.error("Name and abbreviation are required");
      return;
    }
    const success = await onUpdate(subject.id, name, abbreviation);
    if (success) setEditOpen(false);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${subject.name}"?`)) {
      await onDelete(subject.id);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-auto p-1 font-semibold text-primary hover:bg-primary/10 w-full justify-center gap-1"
          >
            <span>{subject.name}</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuItem onClick={() => { setName(subject.name); setAbbreviation(subject.abbreviation); setEditOpen(true); }}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Subject
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggle(subject.id, !subject.is_active)}>
            {subject.is_active ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Subject
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show Subject
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {canMoveUp && (
            <DropdownMenuItem onClick={onMoveUp}>
              <ArrowUp className="mr-2 h-4 w-4" />
              Move Left
            </DropdownMenuItem>
          )}
          {canMoveDown && (
            <DropdownMenuItem onClick={onMoveDown}>
              <ArrowDown className="mr-2 h-4 w-4" />
              Move Right
            </DropdownMenuItem>
          )}
          {(canMoveUp || canMoveDown) && subject.is_custom && <DropdownMenuSeparator />}
          {subject.is_custom && (
            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Subject
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update subject name and abbreviation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subjectName">Subject Name</Label>
              <Input
                id="subjectName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Mathematics"
              />
            </div>
            <div>
              <Label htmlFor="abbreviation">Abbreviation</Label>
              <Input
                id="abbreviation"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                placeholder="e.g., mat"
                maxLength={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface AddSubjectButtonProps {
  onAdd: (name: string, abbreviation: string) => Promise<boolean>;
}

export const AddSubjectButton = ({ onAdd }: AddSubjectButtonProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");

  const handleAdd = async () => {
    if (!name.trim() || !abbreviation.trim()) {
      toast.error("Name and abbreviation are required");
      return;
    }
    const success = await onAdd(name, abbreviation);
    if (success) {
      setName("");
      setAbbreviation("");
      setOpen(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Subject
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>
              Add a custom subject for your school
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newSubjectName">Subject Name</Label>
              <Input
                id="newSubjectName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Computer Studies"
              />
            </div>
            <div>
              <Label htmlFor="newAbbreviation">Abbreviation</Label>
              <Input
                id="newAbbreviation"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                placeholder="e.g., cst"
                maxLength={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

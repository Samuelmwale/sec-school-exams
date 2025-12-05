import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import { SUBJECTS } from "@/lib/grading";

interface SchoolSubject {
  id: string;
  school_id: string | null;
  name: string;
  abbreviation: string;
  display_order: number;
  is_custom: boolean;
  is_active: boolean;
}

const DEFAULT_SUBJECTS = Object.entries(SUBJECTS).map(([abbr, name], index) => ({
  name,
  abbreviation: abbr,
  display_order: index,
  is_custom: false,
}));

export const SubjectManagement = () => {
  const [subjects, setSubjects] = useState<SchoolSubject[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectAbbr, setNewSubjectAbbr] = useState("");
  const [loading, setLoading] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  useEffect(() => {
    loadSchoolAndSubjects();
  }, []);

  const loadSchoolAndSubjects = async () => {
    try {
      // Get current user's school
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (profile?.school_id) {
        setSchoolId(profile.school_id);
        await loadSubjects(profile.school_id);
      }
    } catch (error) {
      console.error("Error loading school:", error);
    }
  };

  const loadSubjects = async (schoolIdParam: string) => {
    const { data, error } = await supabase
      .from("school_subjects")
      .select("*")
      .eq("school_id", schoolIdParam)
      .order("display_order");

    if (error) {
      console.error("Error loading subjects:", error);
      return;
    }

    if (data && data.length > 0) {
      setSubjects(data);
    } else {
      // Initialize with default subjects if none exist
      await initializeDefaultSubjects(schoolIdParam);
    }
  };

  const initializeDefaultSubjects = async (schoolIdParam: string) => {
    setLoading(true);
    try {
      const subjectsToInsert = DEFAULT_SUBJECTS.map((subj, idx) => ({
        school_id: schoolIdParam,
        name: subj.name,
        abbreviation: subj.abbreviation,
        display_order: idx,
        is_custom: false,
        is_active: true,
      }));

      const { data, error } = await supabase
        .from("school_subjects")
        .insert(subjectsToInsert)
        .select();

      if (error) throw error;
      setSubjects(data || []);
      toast.success("Default subjects initialized");
    } catch (error: any) {
      console.error("Error initializing subjects:", error);
      toast.error("Failed to initialize subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomSubject = async () => {
    if (!newSubjectName.trim() || !newSubjectAbbr.trim()) {
      toast.error("Please enter both name and abbreviation");
      return;
    }

    if (newSubjectAbbr.length > 4) {
      toast.error("Abbreviation should be 4 characters or less");
      return;
    }

    if (!schoolId) {
      toast.error("School not found");
      return;
    }

    setLoading(true);
    try {
      const maxOrder = Math.max(...subjects.map(s => s.display_order), -1);
      
      const { data, error } = await supabase
        .from("school_subjects")
        .insert({
          school_id: schoolId,
          name: newSubjectName.trim(),
          abbreviation: newSubjectAbbr.toLowerCase().trim(),
          display_order: maxOrder + 1,
          is_custom: true,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setSubjects([...subjects, data]);
      setNewSubjectName("");
      setNewSubjectAbbr("");
      toast.success("Subject added successfully");
    } catch (error: any) {
      console.error("Error adding subject:", error);
      if (error.code === "23505") {
        toast.error("A subject with this name or abbreviation already exists");
      } else {
        toast.error("Failed to add subject");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (subject: SchoolSubject) => {
    try {
      const { error } = await supabase
        .from("school_subjects")
        .update({ is_active: !subject.is_active })
        .eq("id", subject.id);

      if (error) throw error;

      setSubjects(subjects.map(s => 
        s.id === subject.id ? { ...s, is_active: !s.is_active } : s
      ));
      toast.success(`${subject.name} ${!subject.is_active ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error toggling subject:", error);
      toast.error("Failed to update subject");
    }
  };

  const handleDeleteSubject = async (subject: SchoolSubject) => {
    if (!subject.is_custom) {
      toast.error("Cannot delete default subjects. You can disable them instead.");
      return;
    }

    try {
      const { error } = await supabase
        .from("school_subjects")
        .delete()
        .eq("id", subject.id);

      if (error) throw error;

      setSubjects(subjects.filter(s => s.id !== subject.id));
      toast.success("Subject deleted");
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error("Failed to delete subject");
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    const newSubjects = [...subjects];
    [newSubjects[index - 1], newSubjects[index]] = [newSubjects[index], newSubjects[index - 1]];
    
    await updateDisplayOrder(newSubjects);
  };

  const handleMoveDown = async (index: number) => {
    if (index === subjects.length - 1) return;
    
    const newSubjects = [...subjects];
    [newSubjects[index], newSubjects[index + 1]] = [newSubjects[index + 1], newSubjects[index]];
    
    await updateDisplayOrder(newSubjects);
  };

  const updateDisplayOrder = async (newSubjects: SchoolSubject[]) => {
    try {
      const updates = newSubjects.map((subj, idx) => ({
        id: subj.id,
        display_order: idx,
      }));

      for (const update of updates) {
        await supabase
          .from("school_subjects")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
      }

      setSubjects(newSubjects.map((s, idx) => ({ ...s, display_order: idx })));
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const activeCount = subjects.filter(s => s.is_active).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Custom Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>Subject Name</Label>
              <Input
                placeholder="e.g., Computer Science"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
            </div>
            <div>
              <Label>Abbreviation (max 4 chars)</Label>
              <Input
                placeholder="e.g., cs"
                value={newSubjectAbbr}
                onChange={(e) => setNewSubjectAbbr(e.target.value.slice(0, 4))}
                maxLength={4}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddCustomSubject} disabled={loading} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>School Subjects ({activeCount} active)</CardTitle>
            <Badge variant="outline">
              Drag to reorder • Toggle to enable/disable
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead>Subject Name</TableHead>
                <TableHead>Abbreviation</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject, index) => (
                <TableRow key={subject.id} className={!subject.is_active ? "opacity-50" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === subjects.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        ↓
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded">{subject.abbreviation}</code>
                  </TableCell>
                  <TableCell>
                    {subject.is_custom ? (
                      <Badge variant="secondary">Custom</Badge>
                    ) : (
                      <Badge variant="outline">Default</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={subject.is_active}
                      onCheckedChange={() => handleToggleActive(subject)}
                    />
                  </TableCell>
                  <TableCell>
                    {subject.is_custom && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSubject(subject)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {subjects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No subjects configured. Click below to initialize default subjects.
              <div className="mt-4">
                <Button onClick={() => schoolId && initializeDefaultSubjects(schoolId)}>
                  Initialize Default Subjects
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

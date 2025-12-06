import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SchoolSubject {
  id: string;
  name: string;
  abbreviation: string;
  display_order: number;
  is_active: boolean;
  is_custom: boolean;
  school_id: string | null;
}

const DEFAULT_SUBJECTS = [
  { name: "English", abbreviation: "eng" },
  { name: "Mathematics", abbreviation: "mat" },
  { name: "Physics", abbreviation: "phy" },
  { name: "Chemistry", abbreviation: "che" },
  { name: "Biology", abbreviation: "bio" },
  { name: "Geography", abbreviation: "geo" },
  { name: "History", abbreviation: "his" },
  { name: "Chichewa", abbreviation: "chi" },
  { name: "Agriculture", abbreviation: "agr" },
  { name: "Social Studies", abbreviation: "soc" },
  { name: "Bible Knowledge", abbreviation: "bk" },
];

export const useSchoolSubjects = () => {
  const [subjects, setSubjects] = useState<SchoolSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const loadSchoolAndSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("school_id")
          .eq("id", user.id)
          .single();
        
        if (profile?.school_id) {
          setSchoolId(profile.school_id);
          await loadSubjects(profile.school_id);
        } else {
          // Fallback to default subjects for non-logged in users
          setSubjects(DEFAULT_SUBJECTS.map((s, i) => ({
            id: `default-${i}`,
            name: s.name,
            abbreviation: s.abbreviation,
            display_order: i,
            is_active: true,
            is_custom: false,
            school_id: null,
          })));
        }
      } else {
        // Fallback to default subjects for non-logged in users
        setSubjects(DEFAULT_SUBJECTS.map((s, i) => ({
          id: `default-${i}`,
          name: s.name,
          abbreviation: s.abbreviation,
          display_order: i,
          is_active: true,
          is_custom: false,
          school_id: null,
        })));
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      // Fallback to defaults on error
      setSubjects(DEFAULT_SUBJECTS.map((s, i) => ({
        id: `default-${i}`,
        name: s.name,
        abbreviation: s.abbreviation,
        display_order: i,
        is_active: true,
        is_custom: false,
        school_id: null,
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubjects = async (schoolIdParam: string) => {
    const { data, error } = await supabase
      .from("school_subjects")
      .select("*")
      .eq("school_id", schoolIdParam)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error loading subjects:", error);
      return;
    }

    if (!data || data.length === 0) {
      // Initialize with defaults if none exist
      await initializeDefaultSubjects(schoolIdParam);
    } else {
      setSubjects(data);
    }
  };

  const initializeDefaultSubjects = async (schoolIdParam: string) => {
    const subjectsToInsert = DEFAULT_SUBJECTS.map((s, i) => ({
      school_id: schoolIdParam,
      name: s.name,
      abbreviation: s.abbreviation,
      display_order: i,
      is_custom: false,
      is_active: true,
    }));

    const { error } = await supabase
      .from("school_subjects")
      .insert(subjectsToInsert);

    if (error) {
      console.error("Error initializing subjects:", error);
      return;
    }

    await loadSubjects(schoolIdParam);
  };

  const addSubject = async (name: string, abbreviation: string) => {
    if (!schoolId) {
      toast.error("No school found");
      return false;
    }

    const maxOrder = subjects.length > 0 
      ? Math.max(...subjects.map(s => s.display_order)) + 1 
      : 0;

    const { error } = await supabase.from("school_subjects").insert({
      school_id: schoolId,
      name,
      abbreviation: abbreviation.toLowerCase(),
      display_order: maxOrder,
      is_custom: true,
      is_active: true,
    });

    if (error) {
      toast.error("Failed to add subject");
      return false;
    }

    await loadSubjects(schoolId);
    toast.success("Subject added");
    return true;
  };

  const updateSubject = async (id: string, name: string, abbreviation: string) => {
    const { error } = await supabase
      .from("school_subjects")
      .update({ name, abbreviation: abbreviation.toLowerCase() })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update subject");
      return false;
    }

    if (schoolId) await loadSubjects(schoolId);
    toast.success("Subject updated");
    return true;
  };

  const toggleSubject = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("school_subjects")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      toast.error("Failed to toggle subject");
      return false;
    }

    if (schoolId) await loadSubjects(schoolId);
    return true;
  };

  const deleteSubject = async (id: string) => {
    const subject = subjects.find(s => s.id === id);
    if (!subject?.is_custom) {
      toast.error("Cannot delete default subjects, disable them instead");
      return false;
    }

    const { error } = await supabase
      .from("school_subjects")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete subject");
      return false;
    }

    if (schoolId) await loadSubjects(schoolId);
    toast.success("Subject deleted");
    return true;
  };

  const reorderSubjects = async (newOrder: SchoolSubject[]) => {
    const updates = newOrder.map((subject, index) => ({
      id: subject.id,
      display_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from("school_subjects")
        .update({ display_order: update.display_order })
        .eq("id", update.id);
    }

    setSubjects(newOrder.map((s, i) => ({ ...s, display_order: i })));
  };

  useEffect(() => {
    loadSchoolAndSubjects();
  }, [loadSchoolAndSubjects]);

  // Get active subjects as a map for backwards compatibility
  const activeSubjectsMap = subjects
    .filter(s => s.is_active)
    .reduce((acc, s) => {
      acc[s.abbreviation] = s.name;
      return acc;
    }, {} as Record<string, string>);

  return {
    subjects,
    activeSubjects: subjects.filter(s => s.is_active),
    activeSubjectsMap,
    loading,
    schoolId,
    addSubject,
    updateSubject,
    toggleSubject,
    deleteSubject,
    reorderSubjects,
    reload: loadSchoolAndSubjects,
  };
};
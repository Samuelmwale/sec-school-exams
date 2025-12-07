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

const STORAGE_KEY = "school_subjects_local";

// Create default subjects with proper structure
const createDefaultSubjects = (): SchoolSubject[] => {
  return DEFAULT_SUBJECTS.map((s, i) => ({
    id: `local-${i}`,
    name: s.name,
    abbreviation: s.abbreviation,
    display_order: i,
    is_active: true,
    is_custom: false,
    school_id: null,
  }));
};

// Get subjects from localStorage
const getLocalSubjects = (): SchoolSubject[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading local subjects:", e);
  }
  return createDefaultSubjects();
};

// Save subjects to localStorage
const saveLocalSubjects = (subjects: SchoolSubject[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  } catch (e) {
    console.error("Error saving local subjects:", e);
  }
};

export const useSchoolSubjects = () => {
  const [subjects, setSubjects] = useState<SchoolSubject[]>(getLocalSubjects);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);

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
          setIsOnline(true);
          await loadSubjectsFromDb(profile.school_id);
          return;
        }
      }
      // Fallback to local storage
      setIsOnline(false);
      setSubjects(getLocalSubjects());
    } catch (error) {
      console.error("Error loading subjects:", error);
      setIsOnline(false);
      setSubjects(getLocalSubjects());
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubjectsFromDb = async (schoolIdParam: string) => {
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

    await loadSubjectsFromDb(schoolIdParam);
  };

  const addSubject = async (name: string, abbreviation: string): Promise<boolean> => {
    const maxOrder = subjects.length > 0 
      ? Math.max(...subjects.map(s => s.display_order)) + 1 
      : 0;

    if (isOnline && schoolId) {
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

      await loadSubjectsFromDb(schoolId);
    } else {
      // Local mode
      const newSubject: SchoolSubject = {
        id: `local-${Date.now()}`,
        name,
        abbreviation: abbreviation.toLowerCase(),
        display_order: maxOrder,
        is_active: true,
        is_custom: true,
        school_id: null,
      };
      const updated = [...subjects, newSubject];
      setSubjects(updated);
      saveLocalSubjects(updated);
    }
    
    toast.success("Subject added");
    return true;
  };

  const updateSubject = async (id: string, name: string, abbreviation: string): Promise<boolean> => {
    if (isOnline && schoolId) {
      const { error } = await supabase
        .from("school_subjects")
        .update({ name, abbreviation: abbreviation.toLowerCase() })
        .eq("id", id);

      if (error) {
        toast.error("Failed to update subject");
        return false;
      }

      await loadSubjectsFromDb(schoolId);
    } else {
      // Local mode
      const updated = subjects.map(s => 
        s.id === id ? { ...s, name, abbreviation: abbreviation.toLowerCase() } : s
      );
      setSubjects(updated);
      saveLocalSubjects(updated);
    }
    
    toast.success("Subject updated");
    return true;
  };

  const toggleSubject = async (id: string, isActive: boolean): Promise<boolean> => {
    if (isOnline && schoolId) {
      const { error } = await supabase
        .from("school_subjects")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) {
        toast.error("Failed to toggle subject");
        return false;
      }

      await loadSubjectsFromDb(schoolId);
    } else {
      // Local mode
      const updated = subjects.map(s => 
        s.id === id ? { ...s, is_active: isActive } : s
      );
      setSubjects(updated);
      saveLocalSubjects(updated);
    }
    
    return true;
  };

  const deleteSubject = async (id: string): Promise<boolean> => {
    const subject = subjects.find(s => s.id === id);
    if (!subject?.is_custom) {
      toast.error("Cannot delete default subjects, disable them instead");
      return false;
    }

    if (isOnline && schoolId) {
      const { error } = await supabase
        .from("school_subjects")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error("Failed to delete subject");
        return false;
      }

      await loadSubjectsFromDb(schoolId);
    } else {
      // Local mode
      const updated = subjects.filter(s => s.id !== id);
      setSubjects(updated);
      saveLocalSubjects(updated);
    }
    
    toast.success("Subject deleted");
    return true;
  };

  const reorderSubjects = async (newOrder: SchoolSubject[]) => {
    const reordered = newOrder.map((s, i) => ({ ...s, display_order: i }));
    
    if (isOnline && schoolId) {
      for (const subject of reordered) {
        await supabase
          .from("school_subjects")
          .update({ display_order: subject.display_order })
          .eq("id", subject.id);
      }
    }
    
    setSubjects(reordered);
    saveLocalSubjects(reordered);
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
    isOnline,
    addSubject,
    updateSubject,
    toggleSubject,
    deleteSubject,
    reorderSubjects,
    reload: loadSchoolAndSubjects,
  };
};

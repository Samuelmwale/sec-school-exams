import { supabase } from "@/integrations/supabase/client";
import { Student } from "@/types/student";
import { storageHelper } from "./storage";

// Helper to get current user's school_id
const getCurrentSchoolId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles' as any)
      .select('school_id')
      .eq('id', user.id)
      .single();

    return (profile as any)?.school_id ?? null;
  } catch (error) {
    console.error('Error getting school_id:', error);
    return null;
  }
};

export const dbSync = {
  // Sync localStorage data to database
  async syncToDatabase(): Promise<void> {
    const localStudents = storageHelper.getStudents();
    if (localStudents.length === 0) return;

    try {
      const schoolId = await getCurrentSchoolId();
      if (!schoolId) {
        console.log('No school_id found, skipping sync');
        return;
      }

      // Insert all students (ignore duplicates)
      const { error } = await supabase
        .from('students')
        .upsert(
          localStudents.map(s => ({
            student_id: s.id,
            name: s.name,
            sex: s.sex,
            class_form: s.classForm,
            year: s.year,
            term: s.term,
            marks: s.marks as any,
            grades: s.grades as any,
            total: s.total,
            rank: s.rank,
            status: s.status,
            school_id: schoolId,
          })),
          { onConflict: 'student_id,class_form,year,term' }
        );

      if (error) {
        console.error('Sync error:', error);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  },

  // Load students from database - FILTERED BY SCHOOL
  async getStudents(classForm?: string, year?: string, term?: string): Promise<Student[]> {
    try {
      const schoolId = await getCurrentSchoolId();
      
      // If no school_id, return empty array (not other schools' data)
      if (!schoolId) {
        console.log('No school_id found, returning empty array');
        return [];
      }

      let query = supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId) // CRITICAL: Filter by school
        .order('total', { ascending: false });

      if (classForm) query = query.eq('class_form', classForm);
      if (year) query = query.eq('year', year);
      if (term) query = query.eq('term', term);

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(s => ({
        id: s.id,
        student_id: s.student_id || s.id,
        name: s.name,
        sex: s.sex as 'M' | 'F',
        classForm: s.class_form as any,
        year: s.year,
        term: s.term as any,
        marks: s.marks as any,
        grades: s.grades as any,
        total: s.total,
        rank: s.rank || 0,
        status: s.status as 'PASS' | 'FAIL',
        average: s.total / Object.keys(s.marks || {}).length || 0,
      }));
    } catch (error) {
      console.error('Failed to load from database:', error);
      return []; // Return empty instead of localStorage to prevent data leakage
    }
  },

  // Save student to database
  async saveStudent(student: Student): Promise<void> {
    try {
      const schoolId = await getCurrentSchoolId();
      if (!schoolId) {
        throw new Error('No school associated with user');
      }

      const { error } = await supabase.from('students').upsert({
        student_id: student.student_id || student.id,
        name: student.name,
        sex: student.sex,
        class_form: student.classForm,
        year: student.year,
        term: student.term,
        marks: student.marks as any,
        grades: student.grades as any,
        total: student.total,
        rank: student.rank,
        status: student.status,
        school_id: schoolId,
      }, { onConflict: 'student_id,class_form,year,term' });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save student:', error);
      throw error;
    }
  },

  // Delete student from database - FILTERED BY SCHOOL
  async deleteStudent(studentId: string, classForm: string, year: string, term: string): Promise<void> {
    try {
      const schoolId = await getCurrentSchoolId();
      if (!schoolId) {
        throw new Error('No school associated with user');
      }

      const { error } = await supabase
        .from('students')
        .delete()
        .eq('student_id', studentId)
        .eq('class_form', classForm)
        .eq('year', year)
        .eq('term', term)
        .eq('school_id', schoolId); // Ensure only delete own school's data

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete student:', error);
      throw error;
    }
  },

  // Clear all students for a class/year/term - FILTERED BY SCHOOL
  async clearClass(classForm: string, year: string, term: string): Promise<void> {
    try {
      const schoolId = await getCurrentSchoolId();
      if (!schoolId) {
        throw new Error('No school associated with user');
      }

      const { error } = await supabase
        .from('students')
        .delete()
        .eq('class_form', classForm)
        .eq('year', year)
        .eq('term', term)
        .eq('school_id', schoolId); // Ensure only delete own school's data

      if (error) throw error;
    } catch (error) {
      console.error('Failed to clear class:', error);
      throw error;
    }
  },
};

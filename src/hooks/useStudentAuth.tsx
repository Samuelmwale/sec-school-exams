import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useStudentAuth = () => {
  const navigate = useNavigate();
  const [isStudent, setIsStudent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStudentStatus();
  }, []);

  const checkStudentStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/student-registration");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "student")
        .single();

      if (!roleData) {
        navigate("/student-registration");
        return;
      }

      setIsStudent(true);
    } catch (error) {
      navigate("/student-registration");
    } finally {
      setLoading(false);
    }
  };

  return { isStudent, loading };
};

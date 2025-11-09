import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface School {
  id: string;
  school_name: string;
  address: string;
}

export const SchoolHeader = () => {
  const [school, setSchool] = useState<School | null>(null);

  useEffect(() => {
    loadSchool();
  }, []);

  const loadSchool = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get user profile with school
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (!profile?.school_id) return;

      // Get school details  
      const { data: schoolData } = await supabase
        .from("schools")
        .select("id, school_name, address")
        .eq("id", profile.school_id)
        .single();

      if (schoolData) {
        setSchool(schoolData);
      }
    } catch (error) {
      console.error("Error loading school:", error);
    }
  };

  if (!school) return null;

  return (
    <div className="bg-primary/5 border-b border-border py-4">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1">
          {school.school_name}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {school.address}
        </p>
      </div>
    </div>
  );
};

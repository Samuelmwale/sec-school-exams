import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface School {
  id: string;
  school_name: string;
  center_number: string;
  division_name: string;
  zone_name: string;
  district_name: string;
  address: string;
  is_active: boolean;
  subscription_expiry: string | null;
}

export const useSchool = () => {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSchool();
  }, []);

  const checkSchool = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Don't redirect, just set loading to false
        setLoading(false);
        return;
      }

      // Get user profile with school
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single() as any;

      if (!profile?.school_id) {
        // Don't redirect, let SystemProtection handle it
        setLoading(false);
        return;
      }

      // Get school details  
      const { data: schoolData, error } = await supabase
        .from("schools" as any)
        .select("*")
        .eq("id", profile.school_id)
        .single() as any;

      if (error || !schoolData) {
        // Don't redirect, let SystemProtection handle it
        setLoading(false);
        return;
      }

      // Check if subscription is active
      if (schoolData.subscription_expiry) {
        const expiry = new Date(schoolData.subscription_expiry);
        if (expiry < new Date()) {
          schoolData.is_active = false;
        }
      }

      setSchool(schoolData as School);
    } catch (error) {
      console.error("Error checking school:", error);
    } finally {
      setLoading(false);
    }
  };

  return { school, loading, refetch: checkSchool };
};

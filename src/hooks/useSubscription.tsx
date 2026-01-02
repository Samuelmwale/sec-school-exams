import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSubscription = () => {
  const [isActive, setIsActive] = useState(true);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user profile with school
      const { data: profile } = await supabase
        .from("profiles" as any)
        .select("school_id")
        .eq("id", user.id)
        .single() as any;

      if (!profile?.school_id) {
        setLoading(false);
        return;
      }

      // Get school subscription status
      const { data: school } = await supabase
        .from("schools" as any)
        .select("is_active, subscription_expiry")
        .eq("id", profile.school_id)
        .single() as any;

      if (school) {
        if (school.subscription_expiry) {
          const expiry = new Date(school.subscription_expiry);
          setExpiryDate(expiry);
          // Reactivation must be based on the CURRENT expiry date (some schools may have stale is_active flags)
          setIsActive(expiry >= new Date());
        } else {
          setExpiryDate(null);
          setIsActive(!!school.is_active);
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  return { isActive, expiryDate, loading, refetch: checkSubscription };
};

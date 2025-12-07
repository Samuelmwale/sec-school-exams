import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { LogOut, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";

interface School {
  id: string;
  school_name: string;
  address: string;
}

export const SchoolHeader = () => {
  const navigate = useNavigate();
  const [school, setSchool] = useState<School | null>(null);
  const [user, setUser] = useState<any>(null);

  const handleLogout = async () => {
    // Clear local admin auth
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("fees_admin_auth");
    localStorage.removeItem("viewer_auth");
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    toast.success("Logged out successfully");
    navigate("/");
  };

  // Idle timeout - auto logout after 10 minutes
  useIdleTimeout(() => {
    if (user) {
      toast.info("Session expired due to inactivity");
      handleLogout();
    }
  }, 10);

  useEffect(() => {
    loadSchool();
    
    // Check auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadSchool = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (!profile?.school_id) return;

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

  return (
    <div className="bg-primary/5 border-b border-border py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <div className="text-center flex-1">
            {school && (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1">
                  {school.school_name}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  {school.address}
                </p>
              </>
            )}
          </div>
          <div className="flex-1 flex justify-end">
            {user ? (
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

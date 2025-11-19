import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { UserCircle } from "lucide-react";

export default function StudentRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Try Student ID first; fallback to Registration Number (Forms 3-4)
      const inputId = formData.studentId.trim();

      const [{ data: studentById, error: errById }, { data: regByNum, error: errReg }] = await Promise.all([
        supabase.from("students").select("*, school_id, year, class_form").eq("student_id", inputId).maybeSingle(),
        supabase.from("student_registrations").select("*, school_id, year, class_form").eq("registration_number", inputId).maybeSingle(),
      ]);

      let student = studentById || null as any;
      let schoolId: string | null = (studentById as any)?.school_id || null;

      // If not found in students by ID, try mapping registration -> students
      if (!student && regByNum) {
        const reg = regByNum as any;
        const normalizedName = formData.name.trim();
        const nameLike = `%${normalizedName.replace(/\s+/g, "%")}%`;

        const { data: matchStudent } = await supabase
          .from("students" as any)
          .select("*, school_id, year, class_form")
          .ilike("name", nameLike)
          .eq("year", reg.year)
          .eq("class_form", reg.class_form)
          .maybeSingle() as any;

        if (matchStudent) {
          student = matchStudent;
          schoolId = (matchStudent as any).school_id || (reg as any).school_id || null;
        } else {
          schoolId = (reg as any).school_id || null;
        }
      }

      if (!student) {
        toast.error("Invalid student ID or registration number. Please check your credentials.");
        setLoading(false);
        return;
      }

      // Get school info via RPC to bypass RLS for public login
      if (!schoolId) {
        toast.error("Student record is not linked to a school. Contact administration.");
        setLoading(false);
        return;
      }
      const { data: school, error: schoolError } = await supabase
        .rpc('get_school_public', { p_school_id: schoolId })
        .single();

      if (schoolError || !school) {
        toast.error("School not found");
        setLoading(false);
        return;
      }

      // Check school subscription
      if (school.subscription_expiry) {
        const expiry = new Date(school.subscription_expiry);
        if (expiry < new Date()) {
          toast.error("School subscription has expired. Contact school administration.");
          setLoading(false);
          return;
        }
      }

      // Store student and school info in session
      sessionStorage.setItem("student_data", JSON.stringify(student));
      sessionStorage.setItem("school_data", JSON.stringify(school));
      
      toast.success("Welcome back!");
      navigate("/student-portal");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <UserCircle className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">WELCOME TO SECONDARY SCHOOL RESULTS MANAGEMENT SYSTEM</CardTitle>
          <CardDescription>
            Please login or register
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="JOHN DOE"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div>
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                placeholder="2025-0001"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value.trim() })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/")}
              disabled={loading}
            >
              Back to Home
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

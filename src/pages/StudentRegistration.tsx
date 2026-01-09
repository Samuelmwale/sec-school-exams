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
      const inputId = formData.studentId.trim().toUpperCase();
      const inputName = formData.name.trim().toUpperCase();

      // Search for student by student_id in students table
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .or(`student_id.ilike.${inputId},student_id.eq.${inputId}`)
        .maybeSingle();

      if (studentError) {
        console.error("Student lookup error:", studentError);
      }

      let student = studentData as any;
      let schoolId: string | null = student?.school_id || null;

      // If not found by student_id, try registration_number
      if (!student) {
        const { data: regData } = await supabase
          .from("student_registrations")
          .select("*")
          .or(`registration_number.ilike.${inputId},registration_number.eq.${inputId}`)
          .maybeSingle();

        if (regData) {
          schoolId = (regData as any).school_id;
          
          // Try to find matching student record
          const { data: matchStudent } = await supabase
            .from("students")
            .select("*")
            .eq("school_id", schoolId)
            .ilike("name", `%${inputName.replace(/\s+/g, "%")}%`)
            .maybeSingle();

          if (matchStudent) {
            student = matchStudent;
            schoolId = (matchStudent as any).school_id || schoolId;
          }
        }
      }

      if (!student) {
        toast.error("Student not found. Please check your Student ID and try again.");
        setLoading(false);
        return;
      }

      // Validate name matches (case-insensitive, partial match)
      const studentName = (student.name || "").toUpperCase();
      const searchName = inputName;
      if (!studentName.includes(searchName) && !searchName.includes(studentName.split(" ")[0])) {
        toast.error("Name does not match the student ID. Please verify your credentials.");
        setLoading(false);
        return;
      }

      if (!schoolId) {
        toast.error("Student record is not linked to a school. Contact administration.");
        setLoading(false);
        return;
      }

      // Get school info via RPC to bypass RLS for public login
      const { data: school, error: schoolError } = await supabase
        .rpc('get_school_public', { p_school_id: schoolId })
        .single();

      if (schoolError || !school) {
        toast.error("School not found. Contact administration.");
        setLoading(false);
        return;
      }

      // Check subscription - ALWAYS check current expiry date (supports reactivation)
      const expiry = school.subscription_expiry ? new Date(school.subscription_expiry) : null;
      const now = new Date();
      const isSubscriptionActive = expiry ? expiry > now : school.is_active === true;
      
      if (!isSubscriptionActive) {
        toast.error("School subscription has expired. Contact school administration to reactivate.");
        setLoading(false);
        return;
      }

      // Clear any stale session data and store fresh data
      sessionStorage.removeItem("student_data");
      sessionStorage.removeItem("school_data");
      sessionStorage.setItem("student_data", JSON.stringify(student));
      sessionStorage.setItem("school_data", JSON.stringify(school));
      
      toast.success(`Welcome ${student.name}! Logging into ${school.school_name} Student Portal...`);
      navigate("/student-portal");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please try again.");
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

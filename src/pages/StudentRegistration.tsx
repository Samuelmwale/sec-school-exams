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
      // Find student by name (case-insensitive) and student_id (from students table)
      const { data: students, error: studentError } = await supabase
        .from("students" as any)
        .select("*, school_id")
        .ilike("name", formData.name.trim())
        .eq("student_id", formData.studentId.trim()) as any;

      if (studentError || !students || students.length === 0) {
        toast.error("Invalid name or student ID. Please check your credentials.");
        setLoading(false);
        return;
      }

      const student = students[0];

      // Get school info
      const { data: school } = await supabase
        .from("schools" as any)
        .select("*")
        .eq("id", student.school_id)
        .single() as any;

      if (!school) {
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
          <CardTitle className="text-2xl">Student Login</CardTitle>
          <CardDescription>
            Enter your name and registration number to access your portal
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

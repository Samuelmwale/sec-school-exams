import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, GraduationCap, DollarSign } from "lucide-react";
import { CLASS_FORMS } from "@/lib/grading";

interface StudentStats {
  class_form: string;
  male_count: number;
  female_count: number;
  total_count: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StudentStats[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalMales, setTotalMales] = useState(0);
  const [totalFemales, setTotalFemales] = useState(0);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    // Get student registration counts by class and gender
    const { data: registrations, error } = await supabase
      .from("student_registrations")
      .select("class_form, sex");

    if (error) {
      console.error("Error loading statistics:", error);
      return;
    }

    // Calculate statistics per class
    const classStats: Record<string, { male: number; female: number }> = {};
    
    registrations?.forEach((reg) => {
      if (!classStats[reg.class_form]) {
        classStats[reg.class_form] = { male: 0, female: 0 };
      }
      if (reg.sex.toLowerCase() === 'm' || reg.sex.toLowerCase() === 'male') {
        classStats[reg.class_form].male++;
      } else {
        classStats[reg.class_form].female++;
      }
    });

    // Convert to array
    const statsArray: StudentStats[] = CLASS_FORMS.map((classForm) => ({
      class_form: classForm,
      male_count: classStats[classForm]?.male || 0,
      female_count: classStats[classForm]?.female || 0,
      total_count: (classStats[classForm]?.male || 0) + (classStats[classForm]?.female || 0),
    }));

    setStats(statsArray);
    
    // Calculate totals
    const totalM = statsArray.reduce((sum, s) => sum + s.male_count, 0);
    const totalF = statsArray.reduce((sum, s) => sum + s.female_count, 0);
    setTotalMales(totalM);
    setTotalFemales(totalF);
    setTotalStudents(totalM + totalF);
  };

  return (
    <div className="min-h-screen bg-background pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">School Management System</h1>
          <p className="text-muted-foreground">Manage students, results, and fees efficiently</p>
        </div>

        {/* Total Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Male Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalMales}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Female Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-600">{totalFemales}</div>
            </CardContent>
          </Card>
        </div>

        {/* Class-wise Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Students by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card key={stat.class_form} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{stat.class_form}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total:</span>
                      <span className="font-bold">{stat.total_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-600">Males:</span>
                      <span className="font-semibold text-blue-600">{stat.male_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-pink-600">Females:</span>
                      <span className="font-semibold text-pink-600">{stat.female_count}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            onClick={() => navigate("/admin")} 
            size="lg" 
            className="h-24 flex flex-col gap-2"
          >
            <GraduationCap className="h-8 w-8" />
            <span>Manage Students</span>
          </Button>
          
          <Button 
            onClick={() => navigate("/student-registration")} 
            size="lg" 
            variant="outline"
            className="h-24 flex flex-col gap-2"
          >
            <UserCheck className="h-8 w-8" />
            <span>Student Portal</span>
          </Button>

          <Button 
            onClick={() => navigate("/fees-admin")} 
            size="lg" 
            variant="outline"
            className="h-24 flex flex-col gap-2"
          >
            <DollarSign className="h-8 w-8" />
            <span>Fees Management</span>
          </Button>

          <Button 
            onClick={() => navigate("/settings")} 
            size="lg" 
            variant="outline"
            className="h-24 flex flex-col gap-2"
          >
            <Users className="h-8 w-8" />
            <span>Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;

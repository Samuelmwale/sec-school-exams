import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, School, Key, Settings } from "lucide-react";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <GraduationCap className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-primary mb-4">
            Secondary School Results Management System
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive system for managing student results, fees, and school administration.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl mb-12">
          <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate("/auth")}>
            <CardHeader className="text-center">
              <School className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle>School Login</CardTitle>
              <CardDescription>
                Access your school's dashboard and manage results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Login / Register
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate("/student-portal")}>
            <CardHeader className="text-center">
              <GraduationCap className="h-12 w-12 text-secondary mx-auto mb-2" />
              <CardTitle>Student Portal</CardTitle>
              <CardDescription>
                View your results and academic records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                Student Access
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin links at bottom */}
      <div className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-4">
            Don't have an account? <span className="font-semibold text-foreground">Admin</span>
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline"
              onClick={() => navigate("/license-admin")}
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              License Admin
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/super-admin")}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Super Admin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;

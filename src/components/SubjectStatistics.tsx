import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Student, ClassForm } from "@/types/student";
import { SUBJECTS, SubjectKey } from "@/lib/grading";

interface SubjectStatisticsProps {
  students: Student[];
  classForm: ClassForm;
}

export const SubjectStatistics = ({ students, classForm }: SubjectStatisticsProps) => {
  const isForm12 = classForm === "Form1" || classForm === "Form2";
  const gradeLabels = isForm12 ? ["A", "B", "C", "D", "F"] : ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  const calculateGradeDistribution = (subjectKey: SubjectKey) => {
    const distribution: { [key: string]: number } = {};
    gradeLabels.forEach((label) => (distribution[label] = 0));

    students.forEach((student) => {
      const grade = student.grades[subjectKey].grade;
      if (distribution[grade] !== undefined) {
        distribution[grade]++;
      }
    });

    return distribution;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-primary">Subject Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(SUBJECTS).map(([key, name]) => {
          const subjectKey = key as SubjectKey;
          const distribution = calculateGradeDistribution(subjectKey);

          return (
            <Card key={key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gradeLabels.map((grade) => (
                    <div key={grade} className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        Grade {grade}:
                      </span>
                      <span className="font-bold text-primary">{distribution[grade]}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Key, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PACKAGES = [
  { name: "1 Month", days: 30 },
  { name: "3 Months", days: 90 },
  { name: "6 Months", days: 180 },
  { name: "1 Year", days: 365 },
  { name: "2 Years", days: 730 },
  { name: "Lifetime", days: 36500 },
];

const ADMIN_PIN = "mwale2024";

const LicenseGenerator = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
      fetchLicenses();
      toast.success("Welcome, Mr Mwale!");
    } else {
      toast.error("Invalid PIN");
      setPin("");
    }
  };

  const fetchLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from("license_codes" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLicenses(data || []);
    } catch (error) {
      console.error("Error fetching licenses:", error);
    }
  };

  const generateLicense = async () => {
    if (!selectedPackage) {
      toast.error("Please select a package");
      return;
    }

    setLoading(true);
    try {
      const pkg = PACKAGES.find(p => p.name === selectedPackage);
      if (!pkg) return;

      // Generate code using the database function
      const { data: codeData, error: codeError } = await supabase
        .rpc("generate_license_code" as any);

      if (codeError) throw codeError;

      const code = codeData as string;

      // Insert the license code
      const { error: insertError } = await supabase
        .from("license_codes" as any)
        .insert({
          code,
          days: pkg.days,
          package_name: pkg.name,
        });

      if (insertError) throw insertError;

      setGeneratedCode(code);
      toast.success("License code generated successfully!");
      fetchLicenses();
    } catch (error) {
      console.error("Error generating license:", error);
      toast.error("Failed to generate license code");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Key className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">License Generator</CardTitle>
            <CardDescription>Mr Mwale's Admin Portal - Enter PIN to access</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter admin PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                required
              />
              <Button type="submit" className="w-full">
                Access Portal
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-2">License Generator</h1>
          <p className="text-muted-foreground mb-8">Mr Mwale's Admin Portal - Generate license codes for schools</p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Generate New License</CardTitle>
              <CardDescription>Select a subscription package and generate a license code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Subscription Package</Label>
                <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKAGES.map((pkg) => (
                      <SelectItem key={pkg.name} value={pkg.name}>
                        {pkg.name} ({pkg.days} days)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={generateLicense} disabled={loading || !selectedPackage} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Generate License Code
                  </>
                )}
              </Button>

              {generatedCode && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <Label className="text-sm text-muted-foreground">Generated License Code:</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 p-3 bg-background rounded border text-lg font-mono tracking-wider">
                      {generatedCode}
                    </code>
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Share this code with the school to activate their subscription
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent License Codes</CardTitle>
              <CardDescription>History of generated license codes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No license codes generated yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      licenses.map((license: any) => (
                        <TableRow key={license.id}>
                          <TableCell className="font-mono">{license.code}</TableCell>
                          <TableCell>{license.package_name}</TableCell>
                          <TableCell>
                            {license.is_used ? (
                              <Badge variant="secondary">Used</Badge>
                            ) : (
                              <Badge variant="default">Available</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(license.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LicenseGenerator;

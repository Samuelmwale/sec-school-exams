import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Activity, Search, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordProtection } from "@/components/PasswordProtection";
import { SystemProtection } from "@/components/SystemProtection";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  activity_type: string;
  details: any;
  created_at: string;
  user_id: string | null;
  student_registration_number: string | null;
  ip_address: string | null;
  user_agent: string | null;
  module: string | null;
  action_description: string | null;
}

const AuditLog = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (profile?.school_id) {
        setSchoolId(profile.school_id);
        await loadLogs(profile.school_id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (sId: string) => {
    const { data, error }: any = await supabase
      .from("activity_logs" as any)
      .select("*")
      .eq("school_id", sId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Error loading logs:", error);
      return;
    }
    setLogs((data || []) as ActivityLog[]);
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Delete this log entry?")) return;

    try {
      const { error } = await supabase
        .from("activity_logs" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Log deleted");
      if (schoolId) await loadLogs(schoolId);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to delete ALL logs? This cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from("activity_logs" as any)
        .delete()
        .eq("school_id", schoolId);

      if (error) throw error;
      toast.success("All logs cleared");
      setLogs([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to clear logs");
    }
  };

  const handleRefresh = async () => {
    if (schoolId) {
      setLoading(true);
      await loadLogs(schoolId);
      setLoading(false);
      toast.success("Logs refreshed");
    }
  };

  const filteredLogs = logs.filter((log) => {
    let matches = true;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matches = matches && (
        log.activity_type.toLowerCase().includes(query) ||
        log.action_description?.toLowerCase().includes(query) ||
        log.module?.toLowerCase().includes(query) ||
        JSON.stringify(log.details).toLowerCase().includes(query)
      );
    }

    if (filterType !== "all") {
      matches = matches && log.activity_type === filterType;
    }

    if (filterDate) {
      const logDate = format(new Date(log.created_at), 'yyyy-MM-dd');
      matches = matches && logDate === filterDate;
    }

    return matches;
  });

  const uniqueTypes = [...new Set(logs.map(l => l.activity_type))];

  const getDeviceInfo = (userAgent: string | null) => {
    if (!userAgent) return "Unknown";
    if (userAgent.includes("Mobile")) return "📱 Mobile";
    if (userAgent.includes("Tablet")) return "📱 Tablet";
    return "💻 Desktop";
  };

  return (
    <SystemProtection>
      <PasswordProtection
        requiredPassword="4444"
        title="Event Manager Access"
        description="Enter password to access audit logs"
        storageKey="audit_auth"
      >
        <div className="min-h-screen bg-background pt-16 pb-8">
          <div className="container mx-auto px-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard
            </Button>

            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                <Activity className="h-8 w-8" />
                Event Manager
              </h1>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="destructive" onClick={handleClearLogs}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{logs.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {logs.filter(l => format(new Date(l.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Event Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{uniqueTypes.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Filtered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{filteredLogs.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search logs..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Activity Type</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {uniqueTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" onClick={() => { setSearchQuery(""); setFilterType("all"); setFilterDate(""); }}>
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded text-xs bg-primary/10 text-primary font-medium">
                              {log.activity_type}
                            </span>
                          </TableCell>
                          <TableCell>{log.module || "-"}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.action_description || (log.details ? JSON.stringify(log.details).substring(0, 50) : "-")}
                          </TableCell>
                          <TableCell>{getDeviceInfo(log.user_agent)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteLog(log.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            {logs.length === 0 ? "No activity logs found." : "No logs match your filters."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PasswordProtection>
    </SystemProtection>
  );
};

export default AuditLog;

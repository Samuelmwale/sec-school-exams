import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Building2, Users, MessageSquare, Ban, Search, 
  Send, Eye, Clock, ArrowLeft, Shield, Unlock,
  Mail, Radio, Activity
} from "lucide-react";
import { format } from "date-fns";

const ADMIN_PIN = "mwale2024";

interface School {
  id: string;
  school_name: string;
  center_number: string;
  division_name: string | null;
  zone_name: string | null;
  district_name: string | null;
  address: string;
  is_active: boolean;
  subscription_expiry: string | null;
  blocked_until: string | null;
  blocked_permanently: boolean;
  block_reason: string | null;
  last_active_at: string | null;
}

interface Student {
  id: string;
  registration_number: string;
  name: string;
  sex: string;
  class_form: string;
  year: string;
  school_id: string | null;
  last_login_at: string | null;
  last_seen_at: string | null;
  school_name?: string;
}

interface Message {
  id: string;
  sender_type: string;
  sender_id: string | null;
  recipient_school_id: string | null;
  is_broadcast: boolean;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  school_name?: string;
}

interface ActivityLog {
  id: string;
  school_id: string | null;
  student_registration_number: string | null;
  activity_type: string;
  details: any;
  created_at: string;
  school_name?: string;
}

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  
  // Message form state
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [messageRecipient, setMessageRecipient] = useState<string>("broadcast");
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Block dialog state
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockSchool, setBlockSchool] = useState<School | null>(null);
  const [blockType, setBlockType] = useState<"temporary" | "permanent">("temporary");
  const [blockDays, setBlockDays] = useState("7");
  const [blockReason, setBlockReason] = useState("");

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
      loadData();
    } else {
      toast.error("Invalid PIN");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load ALL schools using RPC to bypass RLS for super admin view
      // This ensures ALL registered schools are visible regardless of subscription status
      const { data: schoolsData, error: schoolsError } = await supabase
        .rpc('get_all_schools_admin') as any;

      // Fallback to direct query if RPC doesn't exist
      let allSchools = schoolsData;
      if (schoolsError) {
        // Try direct query - the new RLS policy should allow admin access
        const { data: directSchools, error: directError } = await supabase
          .from("schools")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (directError) {
          console.error("Error loading schools:", directError);
          allSchools = [];
        } else {
          allSchools = directSchools || [];
        }
      }

      setSchools((allSchools || []) as School[]);

      // Load students with school names
      const { data: studentsData, error: studentsError } = await supabase
        .from("student_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (studentsError) {
        console.error("Error loading students:", studentsError);
      }
      
      // Map school names to students
      const studentsWithSchools = (studentsData || []).map(student => ({
        ...student,
        school_name: (allSchools || []).find((s: any) => s.id === student.school_id)?.school_name || "Unknown"
      }));
      setStudents(studentsWithSchools as Student[]);

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("admin_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (!messagesError && messagesData) {
        const messagesWithSchools = messagesData.map(msg => ({
          ...msg,
          school_name: msg.recipient_school_id 
            ? (allSchools || []).find((s: any) => s.id === msg.recipient_school_id)?.school_name 
            : "Broadcast"
        }));
        setMessages(messagesWithSchools as Message[]);
      }

      // Load activity logs
      const { data: logsData, error: logsError } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!logsError && logsData) {
        const logsWithSchools = logsData.map(log => ({
          ...log,
          school_name: log.school_id 
            ? (allSchools || []).find((s: any) => s.id === log.school_id)?.school_name 
            : "Unknown"
        }));
        setActivityLogs(logsWithSchools as ActivityLog[]);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter(school =>
    school.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.center_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.district_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.registration_number.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.school_name?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handleBlockSchool = async () => {
    if (!blockSchool) return;
    
    try {
      const updateData: any = {
        block_reason: blockReason,
      };
      
      if (blockType === "permanent") {
        updateData.blocked_permanently = true;
        updateData.blocked_until = null;
      } else {
        updateData.blocked_permanently = false;
        updateData.blocked_until = new Date(Date.now() + parseInt(blockDays) * 24 * 60 * 60 * 1000).toISOString();
      }
      
      const { error } = await supabase
        .from("schools")
        .update(updateData)
        .eq("id", blockSchool.id);

      if (error) throw error;
      
      toast.success(`School ${blockType === "permanent" ? "permanently blocked" : `blocked for ${blockDays} days`}`);
      setBlockDialogOpen(false);
      setBlockSchool(null);
      setBlockReason("");
      loadData();
    } catch (error: any) {
      toast.error("Failed to block school");
    }
  };

  const handleUnblockSchool = async (school: School) => {
    try {
      const { error } = await supabase
        .from("schools")
        .update({
          blocked_permanently: false,
          blocked_until: null,
          block_reason: null,
        })
        .eq("id", school.id);

      if (error) throw error;
      
      toast.success("School unblocked successfully");
      loadData();
    } catch (error: any) {
      toast.error("Failed to unblock school");
    }
  };

  const handleSendMessage = async () => {
    if (!messageSubject.trim() || !messageContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setSendingMessage(true);
    try {
      const messageData: any = {
        sender_type: "admin",
        sender_id: null,
        subject: messageSubject,
        message: messageContent,
        is_broadcast: messageRecipient === "broadcast",
        recipient_school_id: messageRecipient === "broadcast" ? null : messageRecipient,
      };

      const { error } = await supabase
        .from("admin_messages")
        .insert(messageData);

      if (error) throw error;
      
      toast.success(messageRecipient === "broadcast" ? "Broadcast sent to all schools" : "Message sent successfully");
      setMessageSubject("");
      setMessageContent("");
      setMessageRecipient("broadcast");
      loadData();
    } catch (error: any) {
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const isSchoolBlocked = (school: School) => {
    if (school.blocked_permanently) return true;
    if (school.blocked_until && new Date(school.blocked_until) > new Date()) return true;
    return false;
  };

  const getSchoolStatus = (school: School) => {
    if (school.blocked_permanently) return { label: "Blocked Forever", variant: "destructive" as const };
    if (school.blocked_until && new Date(school.blocked_until) > new Date()) {
      return { label: `Blocked until ${format(new Date(school.blocked_until), "PP")}`, variant: "destructive" as const };
    }
    if (!school.is_active) return { label: "Inactive", variant: "secondary" as const };
    if (school.subscription_expiry && new Date(school.subscription_expiry) < new Date()) {
      return { label: "Expired", variant: "outline" as const };
    }
    return { label: "Active", variant: "default" as const };
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Super Admin Access</h1>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <Label htmlFor="pin">Enter Admin PIN</Label>
              <Input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
              />
            </div>
            <Button type="submit" className="w-full">Access Dashboard</Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Schools</p>
                <p className="text-2xl font-bold">{schools.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Ban className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Blocked Schools</p>
                <p className="text-2xl font-bold">{schools.filter(isSchoolBlocked).length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold">{messages.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="schools" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="schools">Schools</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="send">Send Message</TabsTrigger>
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="schools" className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schools by name, center number, or district..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={loadData}>Refresh</Button>
            </div>

            <div className="grid gap-4">
              {filteredSchools.map((school) => {
                const status = getSchoolStatus(school);
                return (
                  <Card key={school.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{school.school_name}</h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <p>Center: {school.center_number}</p>
                          <p>District: {school.district_name || "N/A"}</p>
                          <p>Zone: {school.zone_name || "N/A"}</p>
                          <p>Division: {school.division_name || "N/A"}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{school.address}</p>
                        {school.last_active_at && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last active: {format(new Date(school.last_active_at), "PPp")}
                          </p>
                        )}
                        {school.block_reason && (
                          <p className="text-sm text-destructive mt-2">Block reason: {school.block_reason}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedSchool(school)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{school.school_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Center Number</Label>
                                  <p className="text-sm">{school.center_number}</p>
                                </div>
                                <div>
                                  <Label>District</Label>
                                  <p className="text-sm">{school.district_name || "N/A"}</p>
                                </div>
                                <div>
                                  <Label>Zone</Label>
                                  <p className="text-sm">{school.zone_name || "N/A"}</p>
                                </div>
                                <div>
                                  <Label>Division</Label>
                                  <p className="text-sm">{school.division_name || "N/A"}</p>
                                </div>
                                <div className="col-span-2">
                                  <Label>Address</Label>
                                  <p className="text-sm">{school.address}</p>
                                </div>
                                <div>
                                  <Label>Subscription Expiry</Label>
                                  <p className="text-sm">
                                    {school.subscription_expiry 
                                      ? format(new Date(school.subscription_expiry), "PPP")
                                      : "Not set"}
                                  </p>
                                </div>
                                <div>
                                  <Label>Last Active</Label>
                                  <p className="text-sm">
                                    {school.last_active_at 
                                      ? format(new Date(school.last_active_at), "PPp")
                                      : "Never"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {isSchoolBlocked(school) ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUnblockSchool(school)}
                          >
                            <Unlock className="h-4 w-4 mr-1" />
                            Unblock
                          </Button>
                        ) : (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              setBlockSchool(school);
                              setBlockDialogOpen(true);
                            }}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Block
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name, registration number, or school..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredStudents.slice(0, 50).map((student) => (
                <Card key={student.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Reg: {student.registration_number} | {student.class_form} | {student.year}
                      </p>
                      <p className="text-sm text-muted-foreground">School: {student.school_name}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        {student.last_login_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last login: {format(new Date(student.last_login_at), "PPp")}
                          </span>
                        )}
                        {student.last_seen_at && (
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            Last seen: {format(new Date(student.last_seen_at), "PPp")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setMessageRecipient(student.school_id || "broadcast");
                        setMessageSubject(`Message for student: ${student.name}`);
                      }}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Message School
                    </Button>
                  </div>
                </Card>
              ))}
              {filteredStudents.length > 50 && (
                <p className="text-center text-muted-foreground">
                  Showing 50 of {filteredStudents.length} students. Refine your search to see more.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <div className="grid gap-4">
              {messages.map((msg) => (
                <Card key={msg.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {msg.is_broadcast ? (
                          <Badge variant="secondary"><Radio className="h-3 w-3 mr-1" />Broadcast</Badge>
                        ) : (
                          <Badge variant="outline">To: {msg.school_name}</Badge>
                        )}
                        <Badge variant={msg.sender_type === "admin" ? "default" : "secondary"}>
                          {msg.sender_type === "admin" ? "Admin" : "School"}
                        </Badge>
                      </div>
                      <h3 className="font-semibold">{msg.subject}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{msg.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(msg.created_at), "PPp")}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No messages yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="send" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Message
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>Recipient</Label>
                  <Select value={messageRecipient} onValueChange={setMessageRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="broadcast">
                        <span className="flex items-center gap-2">
                          <Radio className="h-4 w-4" />
                          Broadcast to All Schools
                        </span>
                      </SelectItem>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.school_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    placeholder="Enter message subject"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Enter your message..."
                    rows={6}
                  />
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={sendingMessage}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingMessage ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="grid gap-4">
              {activityLogs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium capitalize">{log.activity_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.school_name} 
                        {log.student_registration_number && ` - Student: ${log.student_registration_number}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "PPp")}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              {activityLogs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No activity logs yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Block School Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block School: {blockSchool?.school_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Block Type</Label>
              <Select value={blockType} onValueChange={(v) => setBlockType(v as "temporary" | "permanent")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Temporary Block</SelectItem>
                  <SelectItem value="permanent">Block Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {blockType === "temporary" && (
              <div>
                <Label>Block Duration (days)</Label>
                <Input
                  type="number"
                  value={blockDays}
                  onChange={(e) => setBlockDays(e.target.value)}
                  min="1"
                />
              </div>
            )}
            <div>
              <Label>Reason for blocking</Label>
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter reason for blocking this school..."
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setBlockDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBlockSchool} className="flex-1">
                Block School
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;
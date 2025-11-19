import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: string;
  is_active: boolean;
  created_at: string;
}

export const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"normal" | "important" | "urgent">("normal");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile?.school_id) return;

    const { data, error } = await supabase
      .from("school_announcements")
      .select("*")
      .eq("school_id", profile.school_id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load announcements");
      return;
    }

    setAnnouncements(data || []);
  };

  const handleAddAnnouncement = async () => {
    if (!title || !message) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile?.school_id) {
      toast.error("School not found");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("school_announcements").insert({
      school_id: profile.school_id,
      title,
      message,
      priority,
      is_active: true,
    });

    if (error) {
      toast.error("Failed to add announcement: " + error.message);
    } else {
      toast.success("Announcement created! Students will see it on login.");
      setTitle("");
      setMessage("");
      setPriority("normal");
      loadAnnouncements();
    }
    setLoading(false);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("school_announcements")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update announcement");
    } else {
      toast.success(currentStatus ? "Announcement hidden" : "Announcement activated");
      loadAnnouncements();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("school_announcements")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete announcement");
    } else {
      toast.success("Announcement deleted");
      loadAnnouncements();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "important":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Create Announcement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement title"
              />
            </div>

            <div>
              <Label>Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter announcement message"
                rows={4}
              />
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAddAnnouncement} disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              Create Announcement
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No announcements yet
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-medium">{announcement.title}</TableCell>
                    <TableCell className="max-w-md truncate">{announcement.message}</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(announcement.priority)}>
                        {announcement.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={announcement.is_active}
                        onCheckedChange={() =>
                          handleToggleActive(announcement.id, announcement.is_active)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

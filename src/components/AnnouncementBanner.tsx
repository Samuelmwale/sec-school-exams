import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { X, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: "normal" | "important" | "urgent";
}

export const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    const stored = sessionStorage.getItem("dismissed_announcements");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    loadAnnouncements();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel("announcements")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "school_announcements",
        },
        () => {
          loadAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAnnouncements = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile?.school_id) return;

    const { data } = await supabase
      .from("school_announcements")
      .select("*")
      .eq("school_id", profile.school_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    setAnnouncements((data as Announcement[]) || []);
  };

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    sessionStorage.setItem("dismissed_announcements", JSON.stringify(newDismissed));
  };

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.includes(a.id)
  );

  const getIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle className="h-5 w-5" />;
      case "important":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "important":
        return "default";
      default:
        return "default";
    }
  };

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {visibleAnnouncements.map((announcement) => (
        <Alert
          key={announcement.id}
          variant={getVariant(announcement.priority)}
          className="relative"
        >
          {getIcon(announcement.priority)}
          <AlertTitle className="pr-8">{announcement.title}</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">
            {announcement.message}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => handleDismiss(announcement.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  );
};

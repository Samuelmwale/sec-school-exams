import { useEffect, useState } from "react";
import { storageHelper } from "@/lib/storage";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { toast } from "sonner";

export const SubscriptionBanner = () => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [reactivationKey, setReactivationKey] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const settings = storageHelper.getSettings();
      if (!settings.subscriptionExpiry) {
        setIsExpired(true);
        return;
      }

      const now = Date.now();
      const diff = settings.subscriptionExpiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("EXPIRED");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      setIsExpired(false);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleReactivate = () => {
    const settings = storageHelper.getSettings();
    if (reactivationKey === settings.adminKey) {
      const newExpiry = Date.now() + settings.subscriptionDays * 24 * 60 * 60 * 1000;
      storageHelper.saveSettings({ ...settings, subscriptionExpiry: newExpiry });
      toast.success("Subscription reactivated successfully!");
      setShowDialog(false);
      setReactivationKey("");
      window.location.reload();
    } else {
      toast.error("Invalid reactivation key!");
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reactivate Subscription</DialogTitle>
          <DialogDescription>
            Enter the admin reactivation key to restore access to the system.
            For subscription or reactivation, contact: 0880425220
          </DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          placeholder="Enter reactivation key"
          value={reactivationKey}
          onChange={(e) => setReactivationKey(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleReactivate}>Reactivate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

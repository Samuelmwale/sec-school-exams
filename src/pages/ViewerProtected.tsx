import { PasswordProtection } from "@/components/PasswordProtection";
import { SystemProtection } from "@/components/SystemProtection";
import Viewer from "./Viewer";

const ViewerProtected = () => {
  return (
    <SystemProtection>
      <PasswordProtection
        requiredPassword="2233"
        title="Results Access"
        description="Enter password to access results"
        storageKey="viewer_auth"
      >
        <Viewer />
      </PasswordProtection>
    </SystemProtection>
  );
};

export default ViewerProtected;

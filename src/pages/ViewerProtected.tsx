import { PasswordProtection } from "@/components/PasswordProtection";
import Viewer from "./Viewer";

const ViewerProtected = () => {
  return (
    <PasswordProtection
      requiredPassword="2233"
      title="Results Access"
      description="Enter password to access results"
      storageKey="viewer_auth"
    >
      <Viewer />
    </PasswordProtection>
  );
};

export default ViewerProtected;

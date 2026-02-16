import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import { useUser } from "@/context/user-context";

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useUser();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#050B14] flex items-center justify-center p-4">
      {/* Background effect */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 pointer-events-none" />
      
      <OnboardingWizard 
        open={open} 
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) navigate('/'); 
        }} 
      />
    </div>
  );
}

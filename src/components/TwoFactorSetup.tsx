import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Mail, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorSetupProps {
  userId: string;
  email: string;
  isEnabled: boolean;
  onStatusChange: (enabled: boolean) => void;
}

const TwoFactorSetup = ({ userId, email, isEnabled, onStatusChange }: TwoFactorSetupProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"idle" | "sending" | "verify" | "verifying">("idle");
  const [otpValue, setOtpValue] = useState("");

  const sendOTP = async () => {
    setStep("sending");
    try {
      const response = await supabase.functions.invoke("send-otp", {
        body: { email, user_id: userId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setStep("verify");
      toast({
        title: "Verification code sent",
        description: "Check your email for the 6-digit code",
      });
    } catch (error: any) {
      setStep("idle");
      toast({
        title: "Failed to send code",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const verifyOTP = async () => {
    if (otpValue.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setStep("verifying");
    try {
      const response = await supabase.functions.invoke("verify-otp", {
        body: { user_id: userId, code: otpValue },
      });

      if (response.error || !response.data?.success) {
        throw new Error(response.data?.error || "Verification failed");
      }

      // Enable 2FA in database
      const { error: updateError } = await supabase
        .from("user_2fa_settings")
        .upsert({
          user_id: userId,
          is_enabled: true,
        });

      if (updateError) {
        throw updateError;
      }

      onStatusChange(true);
      setStep("idle");
      setOtpValue("");
      toast({
        title: "2FA Enabled!",
        description: "Your account is now more secure",
      });
    } catch (error: any) {
      setStep("verify");
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const disable2FA = async () => {
    try {
      const { error } = await supabase
        .from("user_2fa_settings")
        .update({ is_enabled: false })
        .eq("user_id", userId);

      if (error) throw error;

      onStatusChange(false);
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been turned off",
      });
    } catch (error: any) {
      toast({
        title: "Failed to disable 2FA",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="glass p-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-semibold">Two-Factor Authentication</h3>
      </div>

      {isEnabled ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-500">
            <Check className="w-5 h-5" />
            <span>2FA is enabled</span>
          </div>
          <p className="text-gray-400 text-sm">
            Your account is protected with email-based two-factor authentication.
          </p>
          <Button variant="destructive" onClick={disable2FA}>
            Disable 2FA
          </Button>
        </div>
      ) : step === "idle" ? (
        <div className="space-y-4">
          <p className="text-gray-400">
            Add an extra layer of security to your account by enabling email-based 2FA.
          </p>
          <Button onClick={sendOTP} className="button-gradient">
            <Mail className="w-4 h-4 mr-2" />
            Enable 2FA
          </Button>
        </div>
      ) : step === "sending" ? (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Sending verification code...</span>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <p className="text-gray-400">
            Enter the 6-digit code sent to <span className="text-primary">{email}</span>
          </p>
          
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otpValue}
              onChange={setOtpValue}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setStep("idle");
                setOtpValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={verifyOTP}
              disabled={step === "verifying" || otpValue.length !== 6}
              className="button-gradient"
            >
              {step === "verifying" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Enable"
              )}
            </Button>
          </div>

          <button
            onClick={sendOTP}
            className="text-sm text-primary hover:underline"
          >
            Didn't receive the code? Send again
          </button>
        </motion.div>
      )}
    </Card>
  );
};

export default TwoFactorSetup;

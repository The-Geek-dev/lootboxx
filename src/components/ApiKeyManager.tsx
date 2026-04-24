import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface ApiKeyManagerProps {
  userId: string;
}

const ApiKeyManager = ({ userId }: ApiKeyManagerProps) => {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(["read"]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, [userId]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      toast({
        title: "Failed to fetch API keys",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your API key",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await supabase.functions.invoke("generate-api-key", {
        body: { name: newKeyName, permissions: newKeyPermissions },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setGeneratedKey(response.data.api_key);
      await fetchApiKeys();
      
      toast({
        title: "API Key Created!",
        description: "Make sure to copy your key - it won't be shown again",
      });
    } catch (error: any) {
      toast({
        title: "Failed to create API key",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", keyId);

      if (error) throw error;

      setApiKeys(apiKeys.filter(k => k.id !== keyId));
      toast({
        title: "API Key deleted",
        description: "The API key has been permanently removed",
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete API key",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleKeyStatus = async (keyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("api_keys")
        .update({ is_active: !isActive })
        .eq("id", keyId);

      if (error) throw error;

      setApiKeys(apiKeys.map(k => 
        k.id === keyId ? { ...k, is_active: !isActive } : k
      ));
    } catch (error: any) {
      toast({
        title: "Failed to update API key",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, keyId?: string) => {
    navigator.clipboard.writeText(text);
    if (keyId) {
      setCopiedKeyId(keyId);
      setTimeout(() => setCopiedKeyId(null), 2000);
    }
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  const resetModal = () => {
    setShowCreateModal(false);
    setNewKeyName("");
    setNewKeyPermissions(["read"]);
    setGeneratedKey(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="glass p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Key className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">API Keys</h3>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="button-gradient" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Create Key
        </Button>
      </div>

      <p className="text-gray-400 text-sm mb-6">
        Use API keys to access the LootBoxx API programmatically.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No API keys yet</p>
          <p className="text-sm">Create one to get started with the API</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{key.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    key.is_active ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                  }`}>
                    {key.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="font-mono">{key.key_prefix}...</span>
                  <span>Permissions: {key.permissions.join(", ")}</span>
                  <span>Last used: {formatDate(key.last_used_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleKeyStatus(key.id, key.is_active)}
                  title={key.is_active ? "Deactivate" : "Activate"}
                >
                  {key.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteApiKey(key.id)}
                  className="text-red-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && !generatedKey && resetModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-md w-full"
            >
              {generatedKey ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Your New API Key</h3>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                    <p className="text-sm text-gray-400 mb-2">
                      Copy this key now - it won't be shown again!
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm break-all font-mono">
                        {generatedKey}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(generatedKey, "new")}
                      >
                        {copiedKeyId === "new" ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button onClick={resetModal} className="w-full">
                    Done
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Create API Key</h3>
                  
                  <div>
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input
                      id="keyName"
                      placeholder="e.g., Production Bot"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Permissions</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="perm-read"
                          checked={newKeyPermissions.includes("read")}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewKeyPermissions([...newKeyPermissions, "read"]);
                            } else {
                              setNewKeyPermissions(newKeyPermissions.filter(p => p !== "read"));
                            }
                          }}
                        />
                        <Label htmlFor="perm-read" className="font-normal">
                          Read - View bot status, trades, and config
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="perm-write"
                          checked={newKeyPermissions.includes("write")}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewKeyPermissions([...newKeyPermissions, "write"]);
                            } else {
                              setNewKeyPermissions(newKeyPermissions.filter(p => p !== "write"));
                            }
                          }}
                        />
                        <Label htmlFor="perm-write" className="font-normal">
                          Write - Update bot configuration
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={resetModal} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      onClick={createApiKey}
                      disabled={isCreating}
                      className="flex-1 button-gradient"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Key"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Documentation */}
      <div className="mt-6 p-4 rounded-lg bg-background/30 border border-border/30">
        <h4 className="font-semibold mb-2">Quick Start</h4>
        <pre className="text-xs text-gray-400 overflow-x-auto">
{`# Get bot status
curl -X GET "${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trading-bot-api/status" \\
  -H "x-api-key: YOUR_API_KEY"

# Get trades
curl -X GET "${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trading-bot-api/trades" \\
  -H "x-api-key: YOUR_API_KEY"`}
        </pre>
      </div>
    </Card>
  );
};

export default ApiKeyManager;

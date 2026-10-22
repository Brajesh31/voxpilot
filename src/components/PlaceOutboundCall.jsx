import { useEffect, useState } from 'react';
import { getAllPhoneNumber } from '@/utils/api/phoneNumberAPI';
import { placeOutboundCall } from '@/utils/api/callAPI';
import { toast } from 'sonner';
import { Phone, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

const COUNTRY_CODES = [
  { code: '+1', label: 'US/CA (+1)' },
  { code: '+91', label: 'IN (+91)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+61', label: 'AU (+61)' },
  { code: '+49', label: 'DE (+49)' },
  { code: '+33', label: 'FR (+33)' },
  { code: '+81', label: 'JP (+81)' },
  { code: '+971', label: 'AE (+971)' },
  { code: '+65', label: 'SG (+65)' },
];

export default function PlaceOutboundCall({ onClose, activeAssistantId }) {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [numbers, setNumbers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingNumbers, setIsFetchingNumbers] = useState(true);
  const [step, setStep] = useState(1);

  const [variableFields, setVariableFields] = useState({});
  const [variables, setVariables] = useState([]);
  
  const assistantDetails = useSelector((state) => state.assistantsApp?.activeDetail?.details || state.assistants?.activeDetail?.details);
  const firstMessage = assistantDetails?.firstMessage || '';
  const promptMessage = assistantDetails?.model?.messages?.[0]?.content || '';

  // Fetch registered Caller IDs from API
  useEffect(() => {
    let isMounted = true;
    setIsFetchingNumbers(true);

    getAllPhoneNumber()
      .then((data) => {
        if (!isMounted) return;
        const availableNumbers = data?.phoneNumbers || (Array.isArray(data) ? data : []);
        if (availableNumbers.length > 0) {
          setNumbers(availableNumbers);
          setPhoneNumberId(availableNumbers[0].id);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        toast.error('Unable to fetch registered phone numbers', {
          description: 'Outbound calling requires at least one registered Caller ID number.',
        });
      })
      .finally(() => {
        if (isMounted) setIsFetchingNumbers(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Extract template variables like {{customer_name}} from greeting and prompt
  useEffect(() => {
    const extractVariables = (text) => {
      if (!text || typeof text !== 'string') return [];
      const matches = text.match(/{{\s*([\w\d_]+)\s*}}/g) || [];
      return matches.map((match) => match.replace(/{{\s*|\s*}}/g, '').trim());
    };

    const varsInFirst = extractVariables(firstMessage);
    const varsInPrompt = extractVariables(promptMessage);
    const uniqueVars = Array.from(new Set([...varsInFirst, ...varsInPrompt]));
    setVariables(uniqueVars);

    setVariableFields((prev) => {
      const updated = { ...prev };
      uniqueVars.forEach((key) => {
        if (!(key in updated)) {
          updated[key] = '';
        }
      });
      return updated;
    });
  }, [firstMessage, promptMessage]);

  const handlePhoneNumberInput = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    if (digitsOnly.length <= 15) {
      setPhoneNumber(digitsOnly);
    }
  };

  const fullDestinationNumber = `${countryCode}${phoneNumber}`;

  const handleNextStep = () => {
    if (step === 1) {
      if (!phoneNumber.trim()) {
        toast.error('Please enter a destination phone number');
        return;
      }

      if (phoneNumber.trim().length < 7 || phoneNumber.trim().length > 15) {
        toast.error('Please enter a valid phone number (7-15 digits)');
        return;
      }

      // Check template variables
      for (const key of variables) {
        if (!variableFields[key] || !variableFields[key].trim()) {
          toast.error(`Please provide a value for variable "{{${key}}}"`);
          return;
        }
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      if (!phoneNumberId) {
        toast.error('Please select an active Caller ID number');
        return;
      }
      handlePlaceCall();
    }
  };

  const handlePlaceCall = async () => {
    if (!activeAssistantId) {
      toast.error('No active voice agent selected');
      return;
    }

    const payload = {
      assistantId: activeAssistantId,
      assistantOverrides: {
        variableValues: variableFields,
      },
      phoneNumberId,
      customer: {
        number: fullDestinationNumber,
      },
    };

    setIsLoading(true);
    try {
      const response = await placeOutboundCall(payload);
      toast.success(response?.messages || 'Outbound call dispatched successfully!', {
        description: `Calling ${fullDestinationNumber}...`,
      });
      onClose();
    } catch (err) {
      toast.error('Failed to initiate call', {
        description: err?.message || 'Please check number availability and balance.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalSteps = 2;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5 text-primary" />
            Dispatch Outbound Call
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Enter destination details & template variables' : 'Confirm Caller ID & dial parameters'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>Step {step} of {totalSteps}</span>
            <span>{step === 1 ? 'Destination' : 'Confirmation'}</span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-1.5" />
        </div>

        {/* Step 1: Destination Number and Variables */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="dest-phone">Recipient Phone Number</Label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-2.5 py-2 bg-muted border border-input rounded-md text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                  aria-label="Country Code"
                >
                  {COUNTRY_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <Input
                  id="dest-phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneNumberInput}
                  placeholder="Enter recipient digits"
                  className="flex-1 font-mono"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Formatted destination: <span className="font-mono text-foreground">{fullDestinationNumber}</span>
              </p>
            </div>

            {/* Template Variables */}
            {variables.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Agent Template Variables
                </div>
                <p className="text-xs text-muted-foreground">
                  Provide dynamic values for placeholders embedded in greeting or prompt.
                </p>
                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                  {variables.map((key) => (
                    <div key={`var-${key}`} className="space-y-1">
                      <Label htmlFor={`var-${key}`} className="text-xs font-medium text-foreground">
                        {key}
                      </Label>
                      <Input
                        id={`var-${key}`}
                        type="text"
                        placeholder={`Value for {{${key}}}`}
                        value={variableFields[key] || ''}
                        onChange={(e) =>
                          setVariableFields((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Caller ID and Confirmation */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/60 p-3.5 space-y-2 border border-border">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Call Summary
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Destination:</span>
                  <p className="font-mono font-medium text-foreground">{fullDestinationNumber}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Agent:</span>
                  <p className="font-medium text-foreground truncate">{assistantDetails?.name || 'Active Agent'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caller-id">Select Caller ID (Outbound DID)</Label>
              {isFetchingNumbers ? (
                <p className="text-xs text-muted-foreground">Loading registered numbers...</p>
              ) : numbers.length > 0 ? (
                <select
                  id="caller-id"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  {numbers.map((val) => (
                    <option key={val.id} value={val.id}>
                      {val.did || val.phoneNumber || val.id}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>No registered Caller ID numbers found on this account. Please assign a phone number in your CallHQ console before dialing.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dialog Actions */}
        <div className="flex justify-between items-center gap-2 pt-3 border-t border-border">
          {step > 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              disabled={isLoading}
            >
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}

          <Button
            onClick={handleNextStep}
            disabled={isLoading || (step === 2 && numbers.length === 0)}
            size="sm"
            className="min-w-[100px]"
          >
            {isLoading ? 'Dispatching...' : step === 2 ? 'Initiate Call' : 'Next Step'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

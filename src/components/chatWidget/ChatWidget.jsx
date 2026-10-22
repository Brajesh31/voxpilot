import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Bot, User } from 'lucide-react';

export default function ChatWidget({ onSendMessage, onClose, messages: externalMessages = [] }) {
  const [messages, setMessages] = useState(externalMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Three-dot loading indicator
  const TypingIndicator = () => (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg px-3 py-2 bg-muted">
        <div className="flex items-center gap-1.5 mb-1 text-primary">
          <Bot className="h-3 w-3" />
          <span className="text-[11px] font-semibold">Agent</span>
        </div>
        <div className="flex items-center space-x-1 py-1">
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const reply = await onSendMessage([...updatedMessages, newMessage]);
      setMessages([...updatedMessages, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: 'Simulation error: Unable to receive response from agent.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (externalMessages.length > 0) {
      setMessages(externalMessages);
    }
  }, [externalMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 sm:w-96 h-[480px] shadow-2xl border border-border bg-card/95 backdrop-blur-md flex flex-col">
        <CardHeader className="py-3 px-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Agent Simulator</CardTitle>
                <p className="text-[10px] text-muted-foreground">Sandboxed prompt test session</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Close test chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Scrollable Messages */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-10 px-4 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Start a conversation</p>
                  <p>Send a message below to test how your voice agent interprets prompts and generates replies.</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground font-normal'
                        : 'bg-muted border border-border text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 opacity-80 text-[10px] font-semibold uppercase tracking-wider">
                      {msg.role === 'user' ? (
                        <>
                          <User className="h-3 w-3" />
                          <span>You</span>
                        </>
                      ) : (
                        <>
                          <Bot className="h-3 w-3 text-primary" />
                          <span>Agent</span>
                        </>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  </div>
                </div>
              ))}
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Bar */}
          <div className="p-3 border-t border-border bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                type="text"
                placeholder="Type a test phrase..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 text-xs h-9"
                autoFocus
              />
              <Button 
                type="submit"
                size="icon" 
                disabled={!input.trim() || loading}
                className="h-9 w-9 shrink-0 shadow-xs"
                aria-label="Send test message"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

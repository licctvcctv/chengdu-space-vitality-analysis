import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X, HelpCircle } from 'lucide-react';

// === Types ===
type MessageType = 'success' | 'warning' | 'error' | 'info';

interface Message {
  id: number;
  type: MessageType;
  content: string;
}

interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: MessageType;
}

interface UIContextType {
  message: {
    success: (text: string) => void;
    warning: (text: string) => void;
    error: (text: string) => void;
    info: (text: string) => void;
  };
  confirm: (content: string, options?: ConfirmOptions) => Promise<boolean>;
}

const UIContext = createContext<UIContextType | null>(null);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

// === Icons Map ===
const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-[#67C23A]" />,
  warning: <AlertTriangle className="w-5 h-5 text-[#E6A23C]" />,
  error: <XCircle className="w-5 h-5 text-[#F56C6C]" />,
  info: <Info className="w-5 h-5 text-[#909399]" />,
};

const BG_COLORS = {
  success: 'bg-[#f0f9eb] border-[#e1f3d8] text-[#67C23A]',
  warning: 'bg-[#fdf6ec] border-[#faecd8] text-[#E6A23C]',
  error: 'bg-[#fef0f0] border-[#fde2e2] text-[#F56C6C]',
  info: 'bg-[#f4f4f5] border-[#e9e9eb] text-[#909399]',
};

// === Provider Component ===
export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // === Message State ===
  const [messages, setMessages] = useState<Message[]>([]);
  const messageIdRef = useRef(0);

  const addMessage = useCallback((type: MessageType, content: string) => {
    const id = messageIdRef.current++;
    setMessages((prev) => [...prev, { id, type, content }]);
    // Auto dismiss
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 3000);
  }, []);

  const messageApi = useMemo(
    () => ({
      success: (text: string) => addMessage('success', text),
      warning: (text: string) => addMessage('warning', text),
      error: (text: string) => addMessage('error', text),
      info: (text: string) => addMessage('info', text)
    }),
    [addMessage]
  );

  // === Confirm Dialog State ===
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    content: string;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((content: string, options: ConfirmOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        isOpen: true,
        content,
        options: {
          title: '提示',
          confirmText: '确定',
          cancelText: '取消',
          type: 'warning',
          ...options,
        },
        resolve,
      });
    });
  }, []);

  const closeDialog = (result: boolean) => {
    if (dialog) {
      dialog.resolve(result);
      setDialog(null);
    }
  };

  const contextValue = useMemo(
    () => ({
      message: messageApi,
      confirm
    }),
    [messageApi, confirm]
  );

  return (
    <UIContext.Provider value={contextValue}>
      {children}

      {/* === Message Container (Toast) === */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[2000] flex flex-col gap-3 pointer-events-none">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded shadow-lg border animate-[slideDown_0.3s_ease-out] min-w-[300px] ${BG_COLORS[msg.type]}`}
          >
            {ICONS[msg.type]}
            <span className="text-sm font-medium">{msg.content}</span>
          </div>
        ))}
      </div>

      {/* === MessageBox Container (Modal) === */}
      {dialog && (
        <div className="fixed inset-0 z-[2001] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s]" onClick={() => closeDialog(false)}></div>
          <div className="bg-white rounded w-[420px] shadow-2xl relative z-10 animate-[scaleIn_0.2s_ease-out] overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
              <span className="text-lg font-medium text-[#303133]">{dialog.options.title}</span>
              <button onClick={() => closeDialog(false)} className="text-gray-400 hover:text-blue-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex items-start gap-3">
               {dialog.options.type === 'warning' && <AlertTriangle className="w-6 h-6 text-[#E6A23C] shrink-0" />}
               {dialog.options.type === 'error' && <XCircle className="w-6 h-6 text-[#F56C6C] shrink-0" />}
               {dialog.options.type === 'info' && <Info className="w-6 h-6 text-[#909399] shrink-0" />}
               {dialog.options.type === 'success' && <CheckCircle className="w-6 h-6 text-[#67C23A] shrink-0" />}
               <div className="text-sm text-[#606266] leading-6 pt-0.5">
                 {dialog.content}
               </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => closeDialog(false)}
                className="px-4 py-2 bg-white border border-[#dcdfe6] text-[#606266] rounded hover:border-[#c6e2ff] hover:text-[#409EFF] hover:bg-[#ecf5ff] text-sm transition-colors"
              >
                {dialog.options.cancelText}
              </button>
              <button 
                onClick={() => closeDialog(true)}
                className="px-4 py-2 bg-[#409EFF] text-white rounded hover:bg-[#66b1ff] text-sm transition-colors shadow-sm"
              >
                {dialog.options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </UIContext.Provider>
  );
};

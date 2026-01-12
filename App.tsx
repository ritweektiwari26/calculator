
import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, History, Sparkles, X, RotateCcw, HelpCircle, MessageSquare } from 'lucide-react';
import { CalculationState, HistoryItem } from './types';
import { explainCalculation, solveComplexMath } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<CalculationState>({
    display: '0',
    history: [],
    isThinking: false,
    error: null,
  });
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [activeTab, setActiveTab] = useState<'calc' | 'history'>('calc');

  const updateDisplay = (val: string) => {
    setState(prev => ({
      ...prev,
      display: prev.display === '0' ? val : prev.display + val,
      error: null
    }));
  };

  const clearDisplay = () => {
    setState(prev => ({ ...prev, display: '0', error: null }));
  };

  const deleteLast = () => {
    setState(prev => ({
      ...prev,
      display: prev.display.length > 1 ? prev.display.slice(0, -1) : '0'
    }));
  };

  const calculateResult = useCallback(async () => {
    if (state.display === '0') return;
    
    try {
      // Basic validation and safe eval
      const sanitizedExpression = state.display.replace(/[^-+*/.0-9]/g, '');
      // eslint-disable-next-line no-eval
      const result = eval(sanitizedExpression).toString();
      
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        expression: state.display,
        result,
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        display: result,
        history: [newItem, ...prev.history].slice(0, 50),
        error: null
      }));
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Invalid Expression' }));
    }
  }, [state.display]);

  const handleAiSolve = async () => {
    if (!aiInput.trim()) return;
    setState(prev => ({ ...prev, isThinking: true }));
    try {
      const data = await solveComplexMath(aiInput);
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        expression: aiInput,
        result: data.numericResult,
        explanation: data.explanation,
        timestamp: new Date(),
      };
      setState(prev => ({
        ...prev,
        display: data.numericResult,
        history: [newItem, ...prev.history],
        isThinking: false,
        error: null
      }));
      setAiInput('');
      setShowAiHelp(false);
    } catch (err: any) {
      setState(prev => ({ ...prev, isThinking: false, error: err.message }));
    }
  };

  const getExplanation = async (item: HistoryItem) => {
    if (item.explanation) return;
    setState(prev => ({ ...prev, isThinking: true }));
    const explanation = await explainCalculation(item.expression, item.result);
    setState(prev => ({
      ...prev,
      isThinking: false,
      history: prev.history.map(h => h.id === item.id ? { ...h, explanation } : h)
    }));
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-hidden">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-[800px] max-h-[90vh]">
        
        {/* Left: Main Calculator Panel */}
        <div className="lg:col-span-7 flex flex-col glass-panel rounded-3xl shadow-2xl overflow-hidden relative">
          
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20">
                <Calculator className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Gemini Math Engine</h1>
            </div>
            <button 
              onClick={() => setShowAiHelp(!showAiHelp)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-full transition-colors font-medium border border-indigo-500/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Solve</span>
            </button>
          </div>

          {/* AI Solve Modal/Overlay */}
          {showAiHelp && (
            <div className="absolute inset-x-0 top-[73px] z-20 p-6 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 animate-in slide-in-from-top duration-300">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-indigo-400">
                  <MessageSquare className="w-5 h-5" />
                  Ask Gemini a Math Problem
                </h2>
                <button onClick={() => setShowAiHelp(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="e.g. Solve for x: 2x + 5 = 15"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSolve()}
                />
                <button 
                  onClick={handleAiSolve}
                  disabled={state.isThinking || !aiInput.trim()}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {state.isThinking ? '...' : 'Solve'}
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500 italic">Gemini Pro will analyze the problem and provide steps.</p>
            </div>
          )}

          {/* Display */}
          <div className="flex-1 flex flex-col justify-end p-8 bg-slate-900/30">
            <div className="text-slate-500 text-right text-lg mb-2 min-h-[1.75rem] font-mono tracking-wider">
              {state.error || (state.history[0]?.expression ? `${state.history[0].expression} =` : '')}
            </div>
            <div className="text-right text-6xl font-light font-mono truncate overflow-x-auto whitespace-nowrap scrollbar-hide py-2">
              {state.display}
            </div>
          </div>

          {/* Keypad */}
          <div className="p-8 grid grid-cols-4 gap-4 bg-slate-900/50">
            <KeypadButton label="C" onClick={clearDisplay} variant="special" />
            <KeypadButton label="DEL" onClick={deleteLast} variant="special" />
            <KeypadButton label="/" onClick={() => updateDisplay('/')} variant="operator" />
            <KeypadButton label="*" onClick={() => updateDisplay('*')} variant="operator" />
            
            <KeypadButton label="7" onClick={() => updateDisplay('7')} />
            <KeypadButton label="8" onClick={() => updateDisplay('8')} />
            <KeypadButton label="9" onClick={() => updateDisplay('9')} />
            <KeypadButton label="-" onClick={() => updateDisplay('-')} variant="operator" />
            
            <KeypadButton label="4" onClick={() => updateDisplay('4')} />
            <KeypadButton label="5" onClick={() => updateDisplay('5')} />
            <KeypadButton label="6" onClick={() => updateDisplay('6')} />
            <KeypadButton label="+" onClick={() => updateDisplay('+')} variant="operator" />
            
            <KeypadButton label="1" onClick={() => updateDisplay('1')} />
            <KeypadButton label="2" onClick={() => updateDisplay('2')} />
            <KeypadButton label="3" onClick={() => updateDisplay('3')} />
            <KeypadButton label="=" onClick={calculateResult} variant="equals" span={1} rowSpan={2} />
            
            <KeypadButton label="0" onClick={() => updateDisplay('0')} span={2} />
            <KeypadButton label="." onClick={() => updateDisplay('.')} />
          </div>
        </div>

        {/* Right: History & AI Explanation Panel */}
        <div className="lg:col-span-5 flex flex-col glass-panel rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              History & Insights
            </h2>
            <button 
              onClick={() => setState(prev => ({ ...prev, history: [] }))}
              className="p-2 text-slate-500 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              title="Clear History"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {state.history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                <Calculator className="w-12 h-12 opacity-20" />
                <p>No recent calculations</p>
              </div>
            ) : (
              state.history.map((item) => (
                <div key={item.id} className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:border-indigo-500/30 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-mono text-slate-400">{item.expression}</span>
                    <span className="text-xs text-slate-600">{item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-2xl font-mono text-indigo-400 mb-3">{item.result}</div>
                  
                  {item.explanation ? (
                    <div className="text-sm text-slate-300 bg-indigo-500/5 border border-indigo-500/20 p-3 rounded-xl">
                      <div className="flex items-center gap-1 text-xs text-indigo-400 font-semibold mb-1 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" />
                        AI Explanation
                      </div>
                      {item.explanation}
                    </div>
                  ) : (
                    <button 
                      onClick={() => getExplanation(item)}
                      disabled={state.isThinking}
                      className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-indigo-400 transition-colors"
                    >
                      <HelpCircle className="w-3 h-3" />
                      {state.isThinking ? 'Analyzing...' : 'Ask Gemini to explain this'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface KeypadButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'operator' | 'special' | 'equals';
  span?: number;
  rowSpan?: number;
}

const KeypadButton: React.FC<KeypadButtonProps> = ({ label, onClick, variant = 'default', span = 1, rowSpan = 1 }) => {
  const baseStyles = "calc-button flex items-center justify-center text-xl font-medium rounded-2xl h-16 shadow-lg active:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";
  
  const variants = {
    default: "bg-slate-800/80 text-slate-100 hover:bg-slate-700 ring-indigo-500/50",
    operator: "bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 ring-indigo-500/50",
    special: "bg-slate-700/50 text-slate-300 hover:bg-slate-700 ring-slate-500/50",
    equals: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30 ring-indigo-400/50"
  };

  return (
    <button 
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${span > 1 ? `col-span-${span}` : ''} ${rowSpan > 1 ? `row-span-${rowSpan} h-full` : ''}`}
    >
      {label}
    </button>
  );
};

export default App;

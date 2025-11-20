import React, { useState, useEffect, useCallback } from 'react';
import { generateQuestions } from './services/gemini';
import { TriviaQuestion, FlashcardStatus, GameState, HighScore } from './types';
import { Card } from './components/Card';
import { Controls } from './components/Controls';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Trophy, Play, ScrollText, RotateCcw, Library } from 'lucide-react';

const STORAGE_KEY = 'polyphonia_scores';

// --- SUB-COMPONENTS ---

interface WelcomeViewProps {
  username: string;
  setUsername: (s: string) => void;
  onStart: () => void;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ username, setUsername, onStart }) => (
  <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center w-full max-w-md mx-auto p-10 bg-slate-900/80 border border-amber-900/30 shadow-2xl relative overflow-hidden"
  >
      {/* Decorative Border Lines */}
      <div className="absolute top-2 left-2 right-2 bottom-2 border border-amber-700/20 pointer-events-none"></div>

      <div className="w-20 h-20 bg-slate-950 border border-amber-700 rounded-full flex items-center justify-center mb-8 shadow-[0_0_25px_rgba(217,119,6,0.2)]">
          <Music className="w-10 h-10 text-amber-600" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-display text-amber-50 mb-2 text-center tracking-tight">POLYPHONIA</h1>
      <p className="text-amber-500/60 text-center mb-10 uppercase tracking-[0.2em] text-[10px] font-bold">Historia & Teoría Musical</p>

      <div className="w-full space-y-6 relative z-10">
          <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 text-center tracking-widest">Identificación del Estudiante</label>
              <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Introduce tu nombre..."
                  className="w-full bg-slate-950 border border-slate-700 text-center rounded-sm px-4 py-3 text-amber-50 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all font-serif placeholder:text-slate-700 placeholder:italic"
                  maxLength={15}
                  autoFocus
              />
          </div>
          <button 
              onClick={onStart}
              disabled={!username.trim()}
              className="w-full group relative overflow-hidden bg-amber-700 hover:bg-amber-600 py-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
              <span className="relative z-10 flex items-center justify-center gap-3 font-display font-bold text-slate-950 tracking-widest">
                  COMENZAR EXAMEN <Play className="w-4 h-4 fill-current" />
              </span>
          </button>
      </div>
  </motion.div>
);

interface ScoreboardViewProps {
  score: number;
  highScores: HighScore[];
  username: string;
  onRestart: () => void;
}

const ScoreboardView: React.FC<ScoreboardViewProps> = ({ score, highScores, username, onRestart }) => (
  <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto bg-slate-900 border-t-4 border-amber-600 p-8 shadow-2xl relative"
  >
      <div className="text-center mb-10">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-6" />
          <h2 className="text-2xl font-display font-bold text-slate-200 uppercase tracking-widest">Resultados Finales</h2>
          <div className="w-16 h-px bg-amber-700/50 mx-auto my-4"></div>
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Puntuación Obtenida</p>
          <div className="text-5xl font-display font-bold text-amber-500">
              {score}
          </div>
      </div>

      <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
              <Library className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Cuadro de Honor</h3>
          </div>
          <div className="space-y-3">
              {highScores.map((entry, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 border-b border-dashed ${entry.date === highScores.find(h => h.score === score && h.name === username)?.date ? 'bg-amber-900/10 border-amber-700' : 'border-slate-800'}`}>
                      <div className="flex items-center gap-4">
                          <span className={`font-serif font-bold w-6 text-center italic ${idx === 0 ? 'text-amber-500' : 'text-slate-600'}`}>{idx + 1}.</span>
                          <span className="font-bold text-slate-300">{entry.name}</span>
                      </div>
                      <span className="font-display font-bold text-slate-400">{entry.score}</span>
                  </div>
              ))}
          </div>
      </div>

      <button 
          onClick={onRestart}
          className="w-full py-4 border border-slate-700 hover:border-amber-600 text-slate-300 hover:text-amber-500 rounded-sm font-display font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
      >
          <RotateCcw className="w-4 h-4" /> Nuevo Intento
      </button>
  </motion.div>
);

interface GameViewProps {
  status: FlashcardStatus;
  questions: TriviaQuestion[];
  currentIndex: number;
  isFlipped: boolean;
  userSelectedAnswer: string | null;
  isTransitioning: boolean;
  onAnswer: (opt: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onRetry: () => void;
  onRestart: () => void;
}

const GameView: React.FC<GameViewProps> = ({
  status,
  questions,
  currentIndex,
  isFlipped,
  userSelectedAnswer,
  isTransitioning,
  onAnswer,
  onNext,
  onPrev,
  onRetry,
  onRestart
}) => (
  <div className="w-full flex flex-col items-center">
      <AnimatePresence mode="wait">
          {status === 'loading' ? (
              <motion.div
                  key="loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-24"
              >
                  <div className="w-16 h-16 border-4 border-slate-800 border-t-amber-600 rounded-full animate-spin mb-8"></div>
                  <h2 className="font-display text-lg text-amber-500/80 tracking-widest">Componiendo Cuestionario...</h2>
              </motion.div>
          ) : questions.length > 0 ? (
              <>
                  <div className="w-full max-w-md mb-4 flex justify-between items-end px-4 border-b border-slate-800 pb-4">
                      <div className="flex items-baseline gap-2">
                          <span className="text-sm text-slate-500 uppercase font-bold tracking-widest">Pregunta</span>
                          <span className="text-3xl font-display font-bold text-amber-500">
                              {(currentIndex + 1)}
                          </span>
                          <span className="text-sm text-slate-600 font-serif italic">de {questions.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <ScrollText className="w-4 h-4 text-amber-700" />
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {questions[currentIndex].category}
                         </span>
                      </div>
                  </div>

                  <Card 
                      key={questions[currentIndex].id} 
                      question={questions[currentIndex]}
                      isFlipped={isFlipped}
                      userSelectedAnswer={userSelectedAnswer}
                      onAnswer={onAnswer}
                  />

                  <Controls 
                      onPrev={onPrev}
                      onNext={onNext}
                      onRefresh={onRestart}
                      hasPrev={currentIndex > 0}
                      hasNext={true} 
                      isLoading={isTransitioning}
                  />
              </>
          ) : (
              <div className="text-center py-20">
                  <p className="mb-6 text-slate-400 font-serif italic">"La música es el silencio entre las notas..." <br/>pero aquí ha habido un error.</p>
                  <button onClick={onRetry} className="px-8 py-3 bg-amber-700 hover:bg-amber-600 text-slate-900 font-bold uppercase tracking-widest">Reintentar</button>
              </div>
          )}
      </AnimatePresence>
  </div>
);

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('welcome');
  const [username, setUsername] = useState('');
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<FlashcardStatus>('idle');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [score, setScore] = useState(0);
  const [userSelectedAnswer, setUserSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setHighScores(JSON.parse(stored));
    }
  }, []);

  const saveScore = useCallback(() => {
    const newScore: HighScore = { name: username || 'Anónimo', score, date: Date.now() };
    const updatedScores = [...highScores, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    setHighScores(updatedScores);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScores));
  }, [highScores, score, username]);

  const startGame = async () => {
    if (!username.trim()) {
        alert("Por favor, identifíquese primero.");
        return;
    }
    setGameState('playing');
    setStatus('loading');
    setScore(0);
    setCurrentIndex(0);
    setIsFlipped(false);
    setUserSelectedAnswer(null);

    const newQuestions = await generateQuestions(10);
    setQuestions(newQuestions);
    setStatus('success');
  };

  const handleGameOver = () => {
    saveScore();
    setGameState('gameover');
  };

  const handleNext = () => {
    if (isTransitioning) return;

    if (currentIndex >= questions.length - 1) {
      handleGameOver();
      return;
    }

    setIsTransitioning(true);
    setIsFlipped(false); 

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setUserSelectedAnswer(null);
      setIsTransitioning(false);
    }, 800);
  };

  const handlePrev = () => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setUserSelectedAnswer(null);
        setIsTransitioning(false);
      }, 800);
    }
  };

  const handleAnswer = (option: string) => {
    if (isFlipped || isTransitioning) return; 

    setUserSelectedAnswer(option);
    const currentQuestion = questions[currentIndex];
    
    if (option === currentQuestion.answer) {
      let points = 100;
      if (currentQuestion.difficulty === 'Medium') points = 200;
      if (currentQuestion.difficulty === 'Hard') points = 300;
      if (currentQuestion.difficulty === 'Extreme') points = 500;
      
      setScore(prev => prev + points);
    }

    setIsFlipped(true);
  };

  const restartGame = () => {
    setGameState('welcome');
    setQuestions([]);
    setScore(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden overflow-y-auto selection:bg-amber-700 selection:text-white flex flex-col font-sans">
      
      {/* Classic Background Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]"></div>
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black opacity-90"></div>

      {/* Persistent Header */}
      {gameState !== 'welcome' && (
        <header className="relative z-10 p-6 flex justify-between items-center max-w-6xl mx-auto w-full border-b border-slate-800/50">
            <div className="flex items-center gap-4">
                <Music className="text-amber-600 w-6 h-6" />
                <h1 className="text-lg font-display font-bold tracking-widest text-slate-300">POLYPHONIA</h1>
            </div>

            <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-amber-700 uppercase font-bold tracking-widest">Estudiante</p>
                    <p className="text-sm font-bold text-slate-300 font-serif italic">{username}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-sm flex items-center gap-3 shadow-inner">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span className="font-display font-bold text-lg tabular-nums text-amber-500">{score}</span>
                </div>
            </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-4 w-full max-w-6xl mx-auto">
        {gameState === 'welcome' && (
            <WelcomeView username={username} setUsername={setUsername} onStart={startGame} />
        )}
        
        {gameState === 'playing' && (
            <GameView 
                status={status}
                questions={questions}
                currentIndex={currentIndex}
                isFlipped={isFlipped}
                userSelectedAnswer={userSelectedAnswer}
                isTransitioning={isTransitioning}
                onAnswer={handleAnswer}
                onNext={handleNext}
                onPrev={handlePrev}
                onRetry={startGame}
                onRestart={restartGame}
            />
        )}

        {gameState === 'gameover' && (
            <ScoreboardView 
                score={score}
                highScores={highScores}
                username={username}
                onRestart={restartGame}
            />
        )}
      </main>
      
      <footer className="relative z-10 p-6 text-center border-t border-slate-900/50">
        <p className="text-slate-700 text-[10px] uppercase tracking-[0.3em] font-bold">
          Ars Longa, Vita Brevis
        </p>
      </footer>
    </div>
  );
};

export default App;
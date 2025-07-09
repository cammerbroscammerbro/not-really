import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, Trophy, Volume2, VolumeX, Circle, Square, Triangle, Star, Heart, Diamond } from 'lucide-react';

type GameState = 'idle' | 'playing' | 'watching' | 'gameOver' | 'adPlaying';
type Color = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

const colors: Color[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

const colorClasses = {
  red: 'bg-gradient-to-br from-red-400 to-red-600',
  blue: 'bg-gradient-to-br from-blue-400 to-blue-600',
  green: 'bg-gradient-to-br from-green-400 to-green-600',
  yellow: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
  purple: 'bg-gradient-to-br from-purple-400 to-purple-600',
  orange: 'bg-gradient-to-br from-orange-400 to-orange-600',
};

const activeColorClasses = {
  red: 'bg-gradient-to-br from-red-200 to-red-400 shadow-2xl shadow-red-400/80 scale-110 ring-4 ring-red-300/50',
  blue: 'bg-gradient-to-br from-blue-200 to-blue-400 shadow-2xl shadow-blue-400/80 scale-110 ring-4 ring-blue-300/50',
  green: 'bg-gradient-to-br from-green-200 to-green-400 shadow-2xl shadow-green-400/80 scale-110 ring-4 ring-green-300/50',
  yellow: 'bg-gradient-to-br from-yellow-200 to-yellow-400 shadow-2xl shadow-yellow-400/80 scale-110 ring-4 ring-yellow-300/50',
  purple: 'bg-gradient-to-br from-purple-200 to-purple-400 shadow-2xl shadow-purple-400/80 scale-110 ring-4 ring-purple-300/50',
  orange: 'bg-gradient-to-br from-orange-200 to-orange-400 shadow-2xl shadow-orange-400/80 scale-110 ring-4 ring-orange-300/50',
};

const watchingColorClasses = {
  red: 'bg-gradient-to-br from-red-300 to-red-500 opacity-40',
  blue: 'bg-gradient-to-br from-blue-300 to-blue-500 opacity-40',
  green: 'bg-gradient-to-br from-green-300 to-green-500 opacity-40',
  yellow: 'bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-40',
  purple: 'bg-gradient-to-br from-purple-300 to-purple-500 opacity-40',
  orange: 'bg-gradient-to-br from-orange-300 to-orange-500 opacity-40',
};

const watchingActiveColorClasses = {
  red: 'bg-gradient-to-br from-red-100 to-red-300 shadow-2xl shadow-red-300/90 scale-125 ring-8 ring-red-200/70 brightness-150',
  blue: 'bg-gradient-to-br from-blue-100 to-blue-300 shadow-2xl shadow-blue-300/90 scale-125 ring-8 ring-blue-200/70 brightness-150',
  green: 'bg-gradient-to-br from-green-100 to-green-300 shadow-2xl shadow-green-300/90 scale-125 ring-8 ring-green-200/70 brightness-150',
  yellow: 'bg-gradient-to-br from-yellow-100 to-yellow-300 shadow-2xl shadow-yellow-300/90 scale-125 ring-8 ring-yellow-200/70 brightness-150',
  purple: 'bg-gradient-to-br from-purple-100 to-purple-300 shadow-2xl shadow-purple-300/90 scale-125 ring-8 ring-purple-200/70 brightness-150',
  orange: 'bg-gradient-to-br from-orange-100 to-orange-300 shadow-2xl shadow-orange-300/90 scale-125 ring-8 ring-orange-200/70 brightness-150',
};

// Symbol patterns that change each round
const symbolSets = [
  [Circle, Square, Triangle, Star, Heart, Diamond],
  [Star, Diamond, Circle, Heart, Square, Triangle],
  [Heart, Triangle, Star, Circle, Diamond, Square],
  [Diamond, Circle, Heart, Triangle, Star, Square],
  [Square, Star, Diamond, Circle, Triangle, Heart],
  [Triangle, Heart, Square, Star, Circle, Diamond],
];

// Declare CrazyGames SDK types
declare global {
  interface Window {
    CrazyGames?: {
      SDK?: {
        ad?: {
          requestAd: (type: 'midgame' | 'rewarded', callbacks: {
            adStarted: () => void;
            adFinished: () => void;
            adError: (error: { code: string; message: string }) => void;
          }) => void;
          hasAdblock: () => Promise<boolean>;
        };
      };
    };
  }
}

function App() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerSequence, setPlayerSequence] = useState<Color[]>([]);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('colorMemoryHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentRound, setCurrentRound] = useState(0);
  const [adShownForRound5, setAdShownForRound5] = useState(false);
  const [gameStateBeforeAd, setGameStateBeforeAd] = useState<GameState>('idle');
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  // Enhanced sound effects
  const playClickSound = useCallback(() => {
    if (!soundEnabled || gameState === 'adPlaying') return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, [soundEnabled, gameState]);

  const playSuccessSound = useCallback(() => {
    if (!soundEnabled || gameState === 'adPlaying') return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Success chord progression
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  }, [soundEnabled, gameState]);

  const playErrorSound = useCallback(() => {
    if (!soundEnabled || gameState === 'adPlaying') return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Error sound - descending tone
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, [soundEnabled, gameState]);

  // Color sequence sound effects
  const playSound = useCallback((color: Color) => {
    if (!soundEnabled || gameState === 'adPlaying') return;
    
    const frequencies = {
      red: 261.63,    // C4
      blue: 329.63,   // E4
      green: 392.00,  // G4
      yellow: 523.25, // C5
      purple: 659.25, // E5
      orange: 783.99, // G5
    };

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequencies[color];
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, [soundEnabled, gameState]);

  // CrazyGames Ad Integration
  const showMidgameAd = useCallback(() => {
    if (!window.CrazyGames?.SDK?.ad) {
      console.log('CrazyGames SDK not available');
      return;
    }

    const callbacks = {
      adStarted: () => {
        console.log('Start midgame ad');
        setGameStateBeforeAd(gameState);
        setGameState('adPlaying');
        // stopBackgroundMusic(); // Stop background music during ad
      },
      adFinished: () => {
        console.log('End midgame ad');
        setGameState(gameStateBeforeAd);
        // Background music will restart automatically when gameState changes
      },
      adError: (error: { code: string; message: string }) => {
        console.log('Error midgame ad', error);
        setGameState(gameStateBeforeAd);
        // Continue game even if ad fails
      }
    };

    window.CrazyGames.SDK.ad.requestAd('midgame', callbacks);
  }, [gameState, gameStateBeforeAd]);

  const generateNewColor = useCallback(() => {
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const startGame = useCallback(() => {
    const newColor = generateNewColor();
    setSequence([newColor]);
    setPlayerSequence([]);
    setScore(0);
    setCurrentRound(0);
    setAdShownForRound5(false);
    setGameState('watching');
    setCurrentSequenceIndex(0);
    playClickSound();
  }, [generateNewColor, playClickSound]);

  const nextRound = useCallback(() => {
    const newColor = generateNewColor();
    const nextRoundNumber = currentRound + 1;
    
    setSequence(prev => [...prev, newColor]);
    setPlayerSequence([]);
    setCurrentRound(nextRoundNumber);
    
    playSuccessSound(); // Play success sound for completing round
    
    // Show ad when crossing round 5 (round 6 starts)
    if (nextRoundNumber === 5 && !adShownForRound5) {
      setAdShownForRound5(true);
      showMidgameAd();
      // The ad callbacks will handle continuing the game
      setTimeout(() => {
        setGameState('watching');
        setCurrentSequenceIndex(0);
      }, 100);
    } else {
      setGameState('watching');
      setCurrentSequenceIndex(0);
    }
  }, [generateNewColor, currentRound, adShownForRound5, showMidgameAd, playSuccessSound]);

  const playSequence = useCallback(() => {
    if (currentSequenceIndex >= sequence.length) {
      setGameState('playing');
      return;
    }

    const color = sequence[currentSequenceIndex];
    setActiveColor(color);
    playSound(color);

    setTimeout(() => {
      setActiveColor(null);
      setTimeout(() => {
        setCurrentSequenceIndex(prev => prev + 1);
      }, 300);
    }, 800);
  }, [currentSequenceIndex, sequence, playSound]);

  const handleColorClick = useCallback((color: Color) => {
    if (gameState !== 'playing') return;

    const newPlayerSequence = [...playerSequence, color];
    setPlayerSequence(newPlayerSequence);
    setActiveColor(color);
    playSound(color);
    playClickSound(); // Add click sound feedback

    setTimeout(() => {
      setActiveColor(null);
    }, 200);

    // Check if the player's move is correct
    if (color !== sequence[newPlayerSequence.length - 1]) {
      setGameState('gameOver');
      playErrorSound(); // Play error sound
      return;
    }

    // Check if the player completed the sequence
    if (newPlayerSequence.length === sequence.length) {
      const newScore = score + sequence.length;
      setScore(newScore);
      
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('colorMemoryHighScore', newScore.toString());
      }

      setTimeout(() => {
        nextRound();
      }, 1000);
    }
  }, [gameState, playerSequence, sequence, score, highScore, playSound, playClickSound, playErrorSound, nextRound]);

  const resetGame = useCallback(() => {
    setGameState('idle');
    setSequence([]);
    setPlayerSequence([]);
    setScore(0);
    setCurrentRound(0);
    setCurrentSequenceIndex(0);
    setActiveColor(null);
    setAdShownForRound5(false);
    playClickSound();
    // stopBackgroundMusic();
  }, [playClickSound]);

  useEffect(() => {
    if (gameState === 'watching') {
      const timer = setTimeout(playSequence, 1200);
      return () => clearTimeout(timer);
    }
  }, [gameState, playSequence]);

  // Add getCurrentSymbols function back
  const getCurrentSymbols = useCallback(() => {
    return symbolSets[currentRound % symbolSets.length];
  }, [currentRound]);

  const currentSymbols = getCurrentSymbols();

  // Remove all references to audioRef in useEffect
  useEffect(() => {
    const startAudio = () => {
      window.removeEventListener('pointerdown', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
    window.addEventListener('pointerdown', startAudio);
    window.addEventListener('keydown', startAudio);
    return () => {
      window.removeEventListener('pointerdown', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
  }, []);

  // Add background music using <audio> and user interaction for autoplay compliance
  useEffect(() => {
    const startBgMusic = () => {
      if (bgAudioRef.current) {
        bgAudioRef.current.volume = 0.18;
        bgAudioRef.current.play().catch(() => {});
      }
      window.removeEventListener('pointerdown', startBgMusic);
      window.removeEventListener('keydown', startBgMusic);
    };
    window.addEventListener('pointerdown', startBgMusic);
    window.addEventListener('keydown', startBgMusic);
    return () => {
      window.removeEventListener('pointerdown', startBgMusic);
      window.removeEventListener('keydown', startBgMusic);
    };
  }, []);

  // Add effect to mute/unmute background music when soundEnabled changes
  useEffect(() => {
    if (bgAudioRef.current) {
      bgAudioRef.current.muted = !soundEnabled;
    }
  }, [soundEnabled]);

  return (
    <>
      <audio ref={bgAudioRef} src="/snowy-peaks-270901.mp3" loop preload="auto" style={{ display: 'none' }} />
      <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-500 ${
        gameState === 'watching' ? 'bg-gray-800' : 'bg-gray-900'
      }`}>
        {/* Light dull overlay during watching sequence */}
        {gameState === 'watching' && (
          <div className="fixed inset-0 bg-gray-900/30 z-10 pointer-events-none" />
        )}
        
        {/* Ad Playing Overlay */}
        {gameState === 'adPlaying' && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl text-center max-w-md">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Advertisement</h3>
              <p className="text-gray-600">Please wait while the ad loads...</p>
            </div>
          </div>
        )}
        
        <div className={`max-w-md w-full text-center relative z-20 transition-all duration-300 ${
          gameState === 'watching' ? 'opacity-80' : 'opacity-100'
        } ${gameState === 'adPlaying' ? 'pointer-events-none opacity-50' : ''}`}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Color Memory</h1>
            <p className="text-gray-400">Remember the sequence and repeat it!</p>
          </div>

          {/* Score Display */}
          <div className={`flex justify-between items-center mb-6 bg-gray-800 rounded-lg p-4 transition-all duration-300 ${
            gameState === 'watching' ? 'opacity-60' : 'opacity-100'
          }`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{score}</div>
              <div className="text-sm text-gray-400">Score</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">
                Round {currentRound + 1}
                {currentRound === 4 && !adShownForRound5 && (
                  <div className="text-xs text-yellow-400 mt-1">Ad after this round!</div>
                )}
              </div>
              <div className="text-sm text-gray-400">Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                <Trophy className="w-5 h-5" />
                {highScore}
              </div>
              <div className="text-sm text-gray-400">Best</div>
            </div>
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playClickSound();
              }}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              disabled={gameState === 'adPlaying'}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-white" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>

          {/* Game Status - Much more visible */}
          <div className="mb-6 h-16 flex items-center justify-center">
            {gameState === 'watching' && (
              <div className="bg-blue-600 text-white px-8 py-4 rounded-xl text-xl font-bold animate-pulse shadow-2xl border-2 border-blue-400 z-30 relative">
                👀 Watch the sequence...
              </div>
            )}
            {gameState === 'playing' && (
              <div className="bg-green-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-2xl border-2 border-green-400">
                🎯 Your turn! Repeat the sequence
              </div>
            )}
            {gameState === 'gameOver' && (
              <div className="bg-red-600 text-white px-8 py-4 rounded-xl text-xl font-bold animate-bounce shadow-2xl border-2 border-red-400">
                💥 Game Over! Try again
              </div>
            )}
            {gameState === 'idle' && (
              <div className="bg-purple-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-2xl border-2 border-purple-400">
                🚀 Ready to start?
              </div>
            )}
            {gameState === 'adPlaying' && (
              <div className="bg-yellow-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-2xl border-2 border-yellow-400">
                📺 Advertisement playing...
              </div>
            )}
          </div>

          {/* Color Grid with Symbols */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {colors.map((color, index) => {
              const IconComponent = currentSymbols[index];
              const isWatching = gameState === 'watching';
              const isActive = activeColor === color;
              
              let buttonClasses = 'w-20 h-20 rounded-lg transition-all duration-300 transform flex items-center justify-center ';
              
              if (isWatching) {
                if (isActive) {
                  buttonClasses += watchingActiveColorClasses[color];
                } else {
                  buttonClasses += watchingColorClasses[color];
                }
              } else {
                if (isActive) {
                  buttonClasses += activeColorClasses[color];
                } else {
                  buttonClasses += colorClasses[color];
                }
              }
              
              if (gameState === 'playing') {
                buttonClasses += ' hover:scale-105 hover:shadow-lg cursor-pointer';
              } else {
                buttonClasses += ' cursor-not-allowed';
              }
              
              if (gameState !== 'playing' && !isWatching) {
                buttonClasses += ' opacity-70';
              }

              return (
                <button
                  key={`${color}-${currentRound}`}
                  onClick={() => handleColorClick(color)}
                  disabled={gameState !== 'playing'}
                  className={buttonClasses}
                >
                  <IconComponent 
                    className={`w-8 h-8 drop-shadow-lg transition-all duration-300 ${
                      isWatching && isActive ? 'text-gray-800' : 'text-white'
                    }`}
                    strokeWidth={2.5}
                  />
                </button>
              );
            })}
          </div>

          {/* Game Controls */}
          <div className={`flex flex-col gap-2 justify-center items-center transition-all duration-300 ${
            gameState === 'watching' ? 'opacity-40 pointer-events-none' : 'opacity-100'
          }`}>
            {gameState === 'idle' && (
              <button
                onClick={startGame}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold shadow-lg"
              >
                <Play className="w-5 h-5" />
                Start Game
              </button>
            )}
            {(gameState === 'gameOver' || gameState === 'playing') && (
              <button
                onClick={resetGame}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold shadow-lg"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
            )}
            {gameState === 'gameOver' && (
              <button
                onClick={async () => {
                  if (window.CrazyGames?.SDK?.ad) {
                    const callbacks = {
                      adStarted: () => {
                        if (bgAudioRef.current) bgAudioRef.current.muted = true;
                      },
                      adFinished: () => {
                        if (bgAudioRef.current) bgAudioRef.current.muted = !soundEnabled;
                        setGameState('playing');
                        setPlayerSequence([]);
                        setActiveColor(null);
                      },
                      adError: () => {
                        if (bgAudioRef.current) bgAudioRef.current.muted = !soundEnabled;
                        setGameState('playing');
                        setPlayerSequence([]);
                        setActiveColor(null);
                      }
                    };
                    window.CrazyGames.SDK.ad.requestAd('rewarded', callbacks);
                  } else {
                    setGameState('playing');
                    setPlayerSequence([]);
                    setActiveColor(null);
                  }
                }}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold shadow-lg mt-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                Revive
              </button>
            )}
          </div>

          {/* Game Instructions */}
          {gameState === 'idle' && (
            <div className="mt-8 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">How to Play</h3>
              <ul className="text-sm text-gray-300 space-y-1 text-left">
                <li>• Watch the sequence of colors and symbols</li>
                <li>• Click the colors in the same order</li>
                <li>• Each round adds a new color and changes symbols</li>
                <li>• Score points for each successful round</li>
                <li>• Advertisement will play after round 5!</li>
                <li>• Try to beat your high score!</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;

import React, { useState } from 'react';
import './PathChoiceGame.css';

const PathChoiceGame = ({ mapImage, correctPath, onComplete }) => {
  const [selectedPath, setSelectedPath] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const handlePathSelect = (pathNumber) => {
    if (showFeedback) return;
    
    setSelectedPath(pathNumber);
    setIsCorrect(pathNumber === correctPath);
    setShowFeedback(true);
    
    if (pathNumber === correctPath) {
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      setTimeout(() => {
        setShowFeedback(false);
        setSelectedPath(null);
      }, 1500);
    }
  };

  const startGame = () => {
    setGameStarted(true);
  };

  if (!gameStarted) {
    return (
      <div className="path-choice-intro">
        <div className="intro-content">
          <h2>Перша гра: Вибір шляху</h2>
          <p>Тобі потрібно вибрати правильний шлях від точки Старт (Школа) до точки Фініш (Твій дім).</p>
          <p>Обери один з трьох доступних шляхів!</p>
          <button className="start-game-button" onClick={startGame}>
            Почати гру
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="path-choice-game">
      <div className="game-header">
        <h3>Вибери правильний шлях</h3>
        <p>Торкнись шляху, який, на твою думку, правильний</p>
      </div>
      
      <div className="map-container">
        <div className="custom-map">
          {/* Start point */}
          <div className="map-point start-point">
            <span>S</span>
          </div>
          
          {/* Finish point */}
          <div className="map-point finish-point">
            <span>F</span>
          </div>
          
          {/* Path 1 (top) */}
          <button 
            className={`path path-1 ${selectedPath === 1 ? 'selected' : ''}`}
            onClick={() => handlePathSelect(1)}
            disabled={showFeedback}
          >
            <div className="path-number">Школа → поле → дім</div>
          </button>
          
          {/* Path 2 (middle - correct) */}
          <button 
            className={`path path-2 ${selectedPath === 2 ? 'selected' : ''} ${correctPath === 2 ? 'correct-path' : ''}`}
            onClick={() => handlePathSelect(2)}
            disabled={showFeedback}
          >
            <div className="path-number">Школа → варус → райісполком → дім</div>
          </button>
          
          {/* Path 3 (bottom) */}
          <button 
            className={`path path-3 ${selectedPath === 3 ? 'selected' : ''}`}
            onClick={() => handlePathSelect(3)}
            disabled={showFeedback}
          >
            <div className="path-number">Школа → інша школа → дім</div>
          </button>
        </div>
      </div>
      
      {showFeedback && (
        <div className={`feedback ${isCorrect ? 'success' : 'error'}`}>
          <div className="feedback-content">
            <h4>{isCorrect ? 'Молодець!' : 'Спробуй ще раз!'}</h4>
            <p>
              {isCorrect 
                ? 'Ти вибрала правильний шлях!' 
                : 'Це не той шлях. Спробуй інший!'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PathChoiceGame;
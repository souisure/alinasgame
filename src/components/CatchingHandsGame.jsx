import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CatchingHandsGame.css';

const CatchingHandsGame = ({ onComplete }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerPosition, setPlayerPosition] = useState({ x: 50, y: 50 });
  const [targetPosition, setTargetPosition] = useState({ x: 200, y: 150 });
  const [attempts, setAttempts] = useState(0); // 0 = перша спроба, 1 = друга (і успішна)
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [gameCompleted, setGameCompleted] = useState(false); // Прапор для завершення всієї гри
  const gameAreaRef = useRef(null);
  const animationRef = useRef(null);

  // Constants for difficulty
  const INITIAL_MOVE_SPEED = 1000; // Початкова швидкість (1 секунда)
  const HARDER_MOVE_SPEED = 400;   // Швидкість після першої невдачі (0.4 секунди)
  const CATCH_RADIUS = 25;         // Зона захоплення (зменшено з 30)

  // useCallback для функцій, що не змінюються, щоб уникнути зайвих перерендерингів
  const startTargetMovement = useCallback(() => {
    const moveTarget = () => {
      if (!gameAreaRef.current || gameCompleted) return;

      const gameArea = gameAreaRef.current.getBoundingClientRect();
      const margin = 40; // Відступ від країв
      const maxX = gameArea.width - margin;
      const maxY = gameArea.height - margin;

      setTargetPosition({
        x: margin + Math.random() * (maxX - margin),
        y: margin + Math.random() * (maxY - margin),
      });

      // Зміна швидкості залежно від спроби
      const currentMoveSpeed = attempts === 0 ? INITIAL_MOVE_SPEED : HARDER_MOVE_SPEED;
      // Додаємо випадкову затримку, щоб рух був менш передбачуваним
      const randomDelay = Math.random() * 200; // Від 0 до 200 мс
      
      animationRef.current = setTimeout(moveTarget, currentMoveSpeed + randomDelay);
    };

    // Запускаємо рух лише якщо гра розпочата і не завершена
    if (gameStarted && !gameCompleted) {
      // Очищуємо попередній таймер перед стартом нового
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      moveTarget();
    }
  }, [gameStarted, gameCompleted, attempts]); // Додали attempts як залежність, бо швидкість від нього залежить

  useEffect(() => {
    if (gameStarted && !gameCompleted) {
      startTargetMovement();
    }
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current); // Використовуємо clearTimeout для setTimeout
      }
    };
  }, [gameStarted, gameCompleted, startTargetMovement]); // Додали startTargetMovement як залежність

  const handleTouch = useCallback((e) => {
    if (!gameStarted || gameCompleted || showFeedback) return;

    e.preventDefault(); // Запобігаємо стандартній поведінці браузера (наприклад, прокручування)
    
    // Отримуємо координати кліка/дотику відносно ігрової області
    const gameArea = gameAreaRef.current.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - gameArea.left;
    const y = clientY - gameArea.top;

    setPlayerPosition({ x, y });

    // Перевірка, чи спіймали ціль
    const distance = Math.sqrt(
      Math.pow(x - targetPosition.x, 2) + Math.pow(y - targetPosition.y, 2)
    );

    if (distance < CATCH_RADIUS) { // Використовуємо нову константу
      handleCatch();
    }
  }, [gameStarted, gameCompleted, showFeedback, targetPosition]); // Додали targetPosition як залежність

  const handleCatch = useCallback(() => {
    // Зупиняємо рух цілі відразу після захоплення
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }

    setGameCompleted(true); // Встановлюємо, що гра в поточному циклі завершена
    
    if (attempts === 0) {
      setAttempts(1); // Збільшуємо кількість спроб
      setFeedbackMessage("Не все так просто. Спробуй ще раз!");
      setShowFeedback(true);

      setTimeout(() => {
        setShowFeedback(false);
        setGameCompleted(false); // Дозволяємо почати наступну спробу
        setGameStarted(true); // Залишаємо гру розпочатою
        setPlayerPosition({ x: 50, y: 50 }); // Скидаємо позицію гравця
        // targetPosition оновиться автоматично при старті нового руху
      }, 2000); // Час на показ повідомлення
    } else {
      setFeedbackMessage("Молодець!");
      setShowFeedback(true);

      setTimeout(() => {
        onComplete(); // Завершуємо гру та переходимо до наступної
      }, 2000); // Час на показ повідомлення
    }
  }, [attempts, onComplete]); // Додали onComplete як залежність

  const startGame = () => {
    setGameStarted(true);
    setAttempts(0); // Завжди починаємо з 0 спроб при новому старті
    setGameCompleted(false);
    setShowFeedback(false);
  };

  // Intro screen
  if (!gameStarted) { // Changed condition to simply !gameStarted
    return (
      <div className="catching-hands-intro">
        <div className="intro-content">
          <h2>Друга гра: Ловіння рук</h2>
          <p>Тобі потрібно спіймати рухому руку своєю рукою.</p>
          <p>Торкнись екрану, щоб перемістити свою руку до цілі!</p>
          <button className="start-game-button" onClick={startGame}>
            Почати гру
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="catching-hands-game">
      <div className="game-header">
        <h3>Спіймай руку!</h3>
        <p>Торкнись екрану, щоб перемістити свою руку</p>
        <p>Спроба: {attempts + 1}</p> {/* Показуємо номер поточної спроби */}
      </div>

      <div
        className="game-area"
        ref={gameAreaRef}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onMouseDown={handleTouch}
        onMouseMove={(e) => e.buttons === 1 && handleTouch(e)}
      >
        {/* Player hand */}
        <div
          className="hand player-hand"
          style={{
            left: `${playerPosition.x}px`,
            top: `${playerPosition.y}px`,
          }}
        >
          ✋
        </div>

        {/* Target hand */}
        <div
          className="hand target-hand"
          style={{
            left: `${targetPosition.x}px`,
            top: `${targetPosition.y}px`,
          }}
        >
          🤚
        </div>

        {/* Catch zone indicator (optional, for debugging/visual hint) */}
        {/*
        <div
          className="catch-zone"
          style={{
            left: `${targetPosition.x - CATCH_RADIUS / 2}px`,
            top: `${targetPosition.y - CATCH_RADIUS / 2}px`,
            width: `${CATCH_RADIUS}px`,
            height: `${CATCH_RADIUS}px`,
          }}
        />
        */}
      </div>

      {showFeedback && (
        <div className={`feedback ${attempts === 1 ? 'success' : 'info'}`}>
          <div className="feedback-content">
            <h4>{feedbackMessage}</h4>
            {attempts === 0 && (
              <p>Наступного разу буде складніше!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CatchingHandsGame;
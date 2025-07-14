import React, { useState, useEffect } from 'react';
import DialogueSystem from './DialogueSystem';
import PathChoiceGame from './PathChoiceGame';
import CatchingHandsGame from './CatchingHandsGame';
import JigsawPuzzleGame from './JigsawPuzzleGame';
import { mockGameData } from '../data/mockData';
import './RomanticGame.css';

// !!! УВАГА !!!
// ЦЕЙ ВЕБХУК БУДЕ ВИДИМИЙ У ВСІХ КОРИСТУВАЧІВ.
// ЦЕ НЕБЕЗПЕЧНО І МОЖЕ ПРИЗВЕСТИ ДО СПАМУ В ВАШОМУ DISCORD-КАНАЛІ!
// ВИКОРИСТОВУЙТЕ НА СВІЙ СТРАХ І РИЗИК.
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/954460193398345758/5eu-Ncii9h8Dqm42zxlh1yYdjDWojZVZxf5iSEUaK3bmzmZ-IvHfWXBk9Fg2JysCKPaj';

const TARGET_OS_TYPE = 'iOS'; // Цільова ОС (наприклад, 'iOS', 'Android', 'Windows', 'MacIntel', 'Linux')
                               // navigator.platform повертає різні значення. 'iPhone' або 'iPad' можуть вказувати на iOS.

const RomanticGame = () => {
  const [currentPhase, setCurrentPhase] = useState('loading'); // Початкова фаза - завантаження/перевірка
  const [accessGranted, setAccessGranted] = useState(false);
  const [gameProgress, setGameProgress] = useState({
    dialogueComplete: false,
    pathChoiceComplete: false,
    catchingHandsComplete: false,
    jigsawPuzzleComplete: false,
  });

  const phases = ['dialogue', 'pathChoice', 'catchingHands', 'jigsawPuzzle', 'complete'];

  // Одноразова перевірка при завантаженні компонента
  useEffect(() => {
    const checkAccessAndNotify = async () => {
      const userAgent = navigator.userAgent;
      const platform = navigator.platform; // Наприклад: 'MacIntel', 'Win32', 'iPhone', 'iPad', 'Linux x86_64'

      let detectedOS = 'Unknown';
      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        detectedOS = 'iOS';
      } else if (/Android/.test(userAgent)) {
        detectedOS = 'Android';
      } else if (/Win/.test(platform)) {
        detectedOS = 'Windows';
      } else if (/Mac/.test(platform)) {
        detectedOS = 'Mac';
      } else if (/Linux/.test(platform)) {
        detectedOS = 'Linux';
      }

      // Спроба отримати IP (не гарантовано, може бути IP проксі)
      let ipAddress = 'Невідомий';
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
      } catch (error) {
        console.warn('Не вдалося отримати IP-адресу:', error);
      }

      const messageContent = `Користувач зайшов на гру!\nIP: ${ipAddress}\nОС: ${detectedOS} (User-Agent: ${userAgent})`;

      // Відправка повідомлення в Discord
      try {
        await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: messageContent }),
        });
        console.log('Повідомлення про вхід успішно відправлено в Discord.');
      } catch (error) {
        console.error('Помилка при відправці повідомлення в Discord:', error);
      }

      // Перевірка на iOS (можна додати додаткові перевірки, якщо потрібно)
      if (detectedOS === TARGET_OS_TYPE) { // Перевіряємо, чи це Аліна
        setAccessGranted(true);
        setCurrentPhase('dialogue'); // Якщо доступ надано, починаємо гру з діалогу
      } else {
        setAccessGranted(false);
        setCurrentPhase('denied'); // Якщо доступ заборонено, показуємо екран заборони
      }
    };

    checkAccessAndNotify();
  }, []); // Пустий масив залежностей означає, що ефект запускається лише один раз при монтуванні

  const handlePhaseComplete = (phase) => {
    setGameProgress(prev => ({ ...prev, [`${phase}Complete`]: true }));
    
    const currentIndex = phases.indexOf(currentPhase);
    if (currentIndex < phases.length - 1) {
      setTimeout(() => {
        setCurrentPhase(phases[currentIndex + 1]);
      }, 1000);
    } 
  };

  const renderCurrentPhase = () => {
    if (currentPhase === 'loading') {
      return (
        <div className="game-loading">
          <p>Перевірка доступу...</p>
        </div>
      );
    }

    if (currentPhase === 'denied') {
      return (
        <div className="access-denied">
          <h2>Вхід заборонено!</h2>
          <p>Вибачте, ця гра призначена тільки для Аліни.</p>
        </div>
      );
    }

    // Решта фаз гри
    switch (currentPhase) {
      case 'dialogue':
        return (
          <DialogueSystem
            dialogues={mockGameData.dialogues}
            bearImage={mockGameData.bearImage}
            onComplete={() => handlePhaseComplete('dialogue')}
          />
        );
      case 'pathChoice':
        return (
          <PathChoiceGame
            mapImage={mockGameData.mapImage}
            correctPath={mockGameData.correctPath}
            onComplete={() => handlePhaseComplete('pathChoice')}
          />
        );
      case 'catchingHands':
        return (
          <CatchingHandsGame
            onComplete={() => handlePhaseComplete('catchingHands')}
          />
        );
      case 'jigsawPuzzle':
        return (
          <JigsawPuzzleGame
            puzzleImages={mockGameData.puzzleImages}
            onComplete={() => handlePhaseComplete('jigsawPuzzle')}
          />
        );
      case 'complete':
        const completionMessage = `🎉🎉🎉 АЛІНА ПОВНІСТЮ ПРОЙШЛА ГРУ! 🎉🎉🎉`;
        try {
          fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: completionMessage }),
          });
          console.log('Повідомлення про завершення гри успішно відправлено в Discord.');
        } catch (error) {
          console.error('Помилка при відправці повідомлення про завершення гри:', error);
        }
        return (
          <div className="game-complete">
            <div className="completion-message">
              <h2>Вітаємо!</h2>
              <p>Ти пройшла всі випробування!</p>
              <p className="final-message">
                Твій наступний крок чекає на тебе в коридорі під подушкою. Удачі!
              </p>
              <div className="completion-hearts">💕✨💕</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="romantic-game">
      <div className="game-container">
        {renderCurrentPhase()}
      </div>
      
      {/* Progress indicator - показуємо тільки якщо доступ надано і не відмовлено */}
      {accessGranted && currentPhase !== 'loading' && currentPhase !== 'denied' && (
        <div className="progress-indicator">
          {phases.slice(0, -1).map((phase, index) => (
            <div
              key={phase}
              className={`progress-dot ${
                phases.indexOf(currentPhase) > index ? 'completed' : 
                phases.indexOf(currentPhase) === index ? 'active' : ''
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RomanticGame;
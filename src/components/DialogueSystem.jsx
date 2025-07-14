import React, { useState, useEffect } from 'react';
import './DialogueSystem.css';

const DialogueSystem = ({ dialogues, bearImage, onComplete }) => {
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (currentDialogueIndex < dialogues.length) {
      startTypingAnimation();
    }
  }, [currentDialogueIndex]);

  const startTypingAnimation = () => {
    setIsTyping(true);
    setShowContinueButton(false);
    setDisplayedText('');
    
    const currentText = dialogues[currentDialogueIndex];
    let charIndex = 0;
    let text = '';
    
    const typingInterval = setInterval(() => {
      if (charIndex < currentText.length) {
        text += currentText[charIndex];
        setDisplayedText(() => text);
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        setShowContinueButton(true);
      }
    }, 50);
  };

  const handleContinue = () => {
    if (currentDialogueIndex < dialogues.length - 1) {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentDialogueIndex(prev => prev + 1);
        setIsVisible(true);
      }, 300);
    } else {
      // Last dialogue, show "Start first game" button
      setShowContinueButton(false);
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 300);
      }, 1000);
    }
  };

  const isLastDialogue = currentDialogueIndex === dialogues.length - 1;

  return (
    <div className="dialogue-system">
      <div className="bear-container">
        <img 
          src={bearImage} 
          alt="Ростік - милий ведмедик" 
          className="bear-image"
        />
        <div className="bear-name">Ростік</div>
      </div>
      
      <div className={`dialogue-box ${isVisible ? 'visible' : ''}`}>
        <div className="dialogue-content">
          <p className="dialogue-text">
            {displayedText}
            {isTyping && <span className="typing-cursor">|</span>}
          </p>
        </div>
        
        <div className="dialogue-controls">
          {showContinueButton && (
            <button 
              className="continue-button"
              onClick={handleContinue}
            >
              {isLastDialogue ? "Почати першу гру" : "Торкніться, щоб продовжити"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DialogueSystem;
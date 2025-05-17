// filepath: c:\Users\gault\Documents\supinfo code\SUPCHAT\frontend\src\pages\SoundTest\SoundTest.jsx
import React from "react";

const SoundTest = () => (
  <div style={{ padding: 40 }}>
    <h1>Test du son de notification</h1>
    <button
      onClick={() => {
        const audio = new Audio(
          require("../../assets/sounds/bell-notification.mp3")
        );
        audio.volume = 0.8;
        audio.play();
      }}
    >
      Jouer le son
    </button>
  </div>
);

export default SoundTest;

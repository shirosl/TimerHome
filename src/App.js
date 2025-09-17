import React, { useState, useEffect, useRef, useCallback } from "react";
// Import the local background image
import sakuraImage from './sakura.jpg';

const App = () => {
  // State for countdown values
  const [hours, setHours] = useState("00");
  const [minutes, setMinutes] = useState("00");
  const [seconds, setSeconds] = useState("00");

  // State to hold the target date
  const [targetDate, setTargetDate] = useState(() => {
    const savedDate = localStorage.getItem("countdownTarget");
    return savedDate ? new Date(savedDate) : new Date("2025-09-19T19:05:00");
  });

  // State for the settings form inputs
  const [showSettings, setShowSettings] = useState(false);
  const [dateInput, setDateInput] = useState(
    targetDate.toISOString().split("T")[0]
  );
  const [timeInput, setTimeInput] = useState(
    targetDate.toTimeString().substring(0, 5)
  );

  // State for celebration messages and animations
  const [arrivalMessageShow, setArrivalMessageShow] = useState(false);
  const [packedMessageShow, setPackedMessageShow] = useState(false);
  const [showReunionAnimation, setShowReunionAnimation] = useState(false);
  const [playPlaneAnimation, setPlayPlaneAnimation] = useState(false);

  // Refs
  const isArrivalSoundPlayed = useRef(false);
  const isPackedCelebrationTriggered = useRef(false);
  const countdownIntervalRef = useRef(null);

  // --- Packing List State & Management ---
  const [packingList, setPackingList] = useState(() => {
    const savedList = localStorage.getItem("packingList");
    return savedList ? JSON.parse(savedList) : [
      { id: "documents", text: "Legal Documents (Passport, ID, Visa)", packed: false },
      { id: "tickets", text: "Flight Tickets / Boarding Passes", packed: false },
      { id: "wallet", text: "Wallet, Currency, Credit Cards", packed: false },
      { id: "wedding-dress", text: "Wedding Dress / Gown", packed: false },
      { id: "wedding-suit", text: "Suit / Tuxedo", packed: false },
      { id: "wedding-shoes", text: "Wedding Shoes (for both)", packed: false },
      { id: "accessories", text: "Accessories (Veil, Jewelry, Cufflinks)", packed: false },
      { id: "makeup", text: "Special Makeup & Hair Products", packed: false },
      { id: "casual-wear", text: "Casual Outfits (4 sets)", packed: false },
      { id: "smart-wear", text: "Smart/Dinner Outfits (2 sets)", packed: false },
      { id: "undergarments", text: "Undergarments & Socks (4+ sets)", packed: false },
      { id: "sleepwear", text: "Sleepwear", packed: false },
      { id: "shoes", text: "Comfortable Walking Shoes", packed: false },
      { id: "jacket", text: "Light Jacket or Cardigan", packed: false },
      { id: "phone-charger", text: "Phone, Chargers, Power Bank", packed: false },
      { id: "toiletries", text: "Full Toiletries Kit", packed: false },
      { id: "medications", text: "Personal Medications", packed: false },
      { id: "adapter", text: "Travel Adapter", packed: false },
      { id: "day-bag", text: "Small Backpack or Day Bag", packed: false },
    ];
  });

  const [newItemText, setNewItemText] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemText, setEditingItemText] = useState("");

  const saveListToStorage = (list) => {
    localStorage.setItem("packingList", JSON.stringify(list));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      packed: false,
    };
    const newList = [...packingList, newItem];
    setPackingList(newList);
    saveListToStorage(newList);
    setNewItemText("");
  };

  const handleRemoveItem = (id) => {
    const newList = packingList.filter((item) => item.id !== id);
    setPackingList(newList);
    saveListToStorage(newList);
  };

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setEditingItemText(item.text);
  };

  const handleUpdateItem = (e) => {
    e.preventDefault();
    const newList = packingList.map((item) =>
      item.id === editingItemId ? { ...item, text: editingItemText } : item
    );
    setPackingList(newList);
    saveListToStorage(newList);
    setEditingItemId(null);
    setEditingItemText("");
  };

  const togglePacked = useCallback((id) => {
    const newList = packingList.map((item) =>
      item.id === id ? { ...item, packed: !item.packed } : item
    );
    setPackingList(newList);
    saveListToStorage(newList);
  }, [packingList]);

  // --- Restored Functions ---
  const playCelebrationSound = useCallback(() => {
    if (isArrivalSoundPlayed.current) return;
    isArrivalSoundPlayed.current = true;
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1.5);
    } catch (e) {
      console.error("Web Audio API not supported or error playing sound:", e);
    }
  }, []);

  const createConfetti = useCallback((colors, count = 50) => {
    for (let i = 0; i < count; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.setProperty("--x", `${(Math.random() - 0.5) * 200}px`);
      confetti.style.setProperty("--y", `${(Math.random() - 0.5) * 200}px`);
      confetti.style.setProperty("--x-end", `${(Math.random() - 0.5) * 500}px`);
      confetti.style.setProperty("--y-end", `${window.innerHeight + 100}px`);
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      document.body.appendChild(confetti);
      confetti.addEventListener("animationend", () => confetti.remove());
    }
  }, []);

  const checkPackingCompletion = useCallback(() => {
    const allItemsPacked = packingList.length > 0 && packingList.every((item) => item.packed);
    if (allItemsPacked) {
      if (!isPackedCelebrationTriggered.current) {
        isPackedCelebrationTriggered.current = true;
        setPackedMessageShow(true);
        createConfetti(["#a7f3d0", "#f6ad55"], 75);
      }
    } else {
      if (isPackedCelebrationTriggered.current) {
        setPackedMessageShow(false);
        isPackedCelebrationTriggered.current = false;
      }
    }
  }, [packingList, createConfetti]);

  const updateCountdown = useCallback(() => {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    if (diff < 0) {
      clearInterval(countdownIntervalRef.current);
      setHours("00"); setMinutes("00"); setSeconds("00");
      setArrivalMessageShow(true);
      setShowReunionAnimation(true);
      setPlayPlaneAnimation(true);
      if (!isArrivalSoundPlayed.current) {
        playCelebrationSound();
        createConfetti(["#f6ad55", "#a7f3d0", "#63b3ed", "#ffffff", "#cbd5e0"], 50);
      }
    } else {
      setHours(String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0"));
      setMinutes(String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0"));
      setSeconds(String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0"));
    }
  }, [targetDate, playCelebrationSound, createConfetti]);
  
  const handleSetCountdown = (e) => {
    e.preventDefault();
    const newTarget = new Date(`${dateInput}T${timeInput}`);
    if (!isNaN(newTarget)) {
      setTargetDate(newTarget);
      localStorage.setItem("countdownTarget", newTarget.toISOString());
      setShowSettings(false);
    } else {
      alert("Invalid date or time format.");
    }
  };

  useEffect(() => {
    checkPackingCompletion();
  }, [checkPackingCompletion]);

  useEffect(() => {
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => clearInterval(countdownIntervalRef.current);
  }, [updateCountdown]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-8 px-4 bg-gradient-radial overflow-hidden relative">
      <style>{`
        body {
          font-family: 'Inter', sans-serif;
          background-image: url(${sakuraImage});
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          background-attachment: fixed;
          margin: 0; padding: 0;
        }
        .countdown-container, .baggage-container, .settings-container {
          background-color: rgba(0, 0, 0, 0.6);
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          text-align: center;
          color: #e2e8f0;
          max-width: 90%;
          width: 800px;
          position: relative;
          margin: 1rem auto;
          animation: fadeIn 1s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .settings-container { padding: 1.5rem; }
        .countdown-title, .baggage-title {
          font-size: 2.5rem; font-weight: 700; margin-bottom: 2rem; color: #ffffff;
          text-shadow: 0 0 15px rgba(255, 255, 255, 0.8), 0 0 25px rgba(99, 179, 237, 0.7);
        }
        .countdown-item { display: inline-block; margin: 0 1.5rem; }
        .countdown-item span {
          display: block; font-size: 5rem; font-weight: 700; color: #a7f3d0;
          text-shadow: 0 0 15px rgba(167, 243, 208, 0.8); min-width: 120px;
          text-align: center; line-height: 1; animation: pulseGlow 2s infinite alternate;
        }
        @keyframes pulseGlow {
          from { text-shadow: 0 0 15px rgba(167, 243, 208, 0.8); }
          to { text-shadow: 0 0 25px rgba(167, 243, 208, 1); }
        }
        .countdown-item div { font-size: 1.25rem; color: #cbd5e0; margin-top: 0.5rem; text-transform: uppercase; }
        .settings-button {
          background-color: #63b3ed; color: white; border: none; padding: 0.75rem 1.5rem;
          border-radius: 8px; font-size: 1rem; cursor: pointer; transition: background-color 0.3s;
        }
        .settings-button:hover { background-color: #4299e1; }
        .settings-form { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1.5rem; }
        .settings-form input {
          background-color: rgba(255, 255, 255, 0.1); color: white; border: 1px solid #4a5568;
          padding: 0.5rem; border-radius: 5px; font-family: inherit;
        }
        .settings-form button {
          background-color: #a7f3d0; color: #1a202c; border: none; padding: 0.5rem 1rem;
          border-radius: 5px; font-weight: bold; cursor: pointer; transition: background-color 0.3s;
        }
        .settings-form button:hover { background-color: #68d391; }
        .message {
          font-size: 1.8rem; color: #f6ad55; margin-top: 3rem; font-weight: 600; opacity: 0;
          transition: opacity 1s ease-out; text-shadow: 0 0 10px rgba(246, 173, 85, 0.7);
        }
        .message.show { opacity: 1; }
        .baggage-list { list-style: none; padding: 0; text-align: left; margin: 2rem auto; max-width: 500px; }
        .baggage-list-item { display: flex; align-items: center; justify-content: space-between; font-size: 1.1rem; margin-bottom: 0.75rem; padding: 0.5rem; border-radius: 5px; transition: background-color 0.2s ease; }
        .baggage-list-item:hover { background-color: rgba(255, 255, 255, 0.05); }
        .item-text { cursor: pointer; flex-grow: 1; padding-left: 2.2rem; position: relative; }
        .item-text.packed { text-decoration: line-through; color: #a0aec0; opacity: 0.7; }
        .item-text::before { content: '✨'; position: absolute; left: 0; top: 50%; transform: translateY(-50%); color: #a7f3d0; font-size: 1.3rem; width: 2rem; text-align: center; }
        .item-text[data-item^="documents"]::before { content: '🛂'; } .item-text[data-item^="tickets"]::before { content: '✈️'; } .item-text[data-item^="wallet"]::before { content: '💰'; } .item-text[data-item^="wedding-dress"]::before { content: '👰'; } .item-text[data-item^="wedding-suit"]::before { content: '🤵'; } .item-text[data-item^="wedding-shoes"]::before { content: '👠'; } .item-text[data-item^="accessories"]::before { content: '💎'; } .item-text[data-item^="makeup"]::before { content: '💄'; } .item-text[data-item^="casual-wear"]::before { content: '👕'; } .item-text[data-item^="smart-wear"]::before { content: '👗'; } .item-text[data-item^="undergarments"]::before { content: '🩲'; } .item-text[data-item^="sleepwear"]::before { content: '🛌'; } .item-text[data-item^="shoes"]::before { content: '👟'; } .item-text[data-item^="jacket"]::before { content: '🧥'; } .item-text[data-item^="phone-charger"]::before { content: '📱'; } .item-text[data-item^="toiletries"]::before { content: '🧴'; } .item-text[data-item^="medications"]::before { content: '💊'; } .item-text[data-item^="adapter"]::before { content: '🔌'; } .item-text[data-item^="day-bag"]::before { content: '🎒'; }
        .item-actions button, .edit-actions button { background: none; border: none; color: #cbd5e0; cursor: pointer; font-size: 1.2rem; margin-left: 0.5rem; transition: color 0.2s ease; }
        .item-actions button:hover { color: #fff; }
        .item-management-form, .edit-form { display: flex; gap: 0.5rem; margin-top: 1.5rem; max-width: 500px; margin-left: auto; margin-right: auto; }
        .item-management-form input, .edit-form input { flex-grow: 1; background-color: rgba(255, 255, 255, 0.1); color: white; border: 1px solid #4a5568; padding: 0.75rem; border-radius: 5px; font-family: inherit; font-size: 1rem; }
        .item-management-form button, .edit-form button { background-color: #a7f3d0; color: #1a202c; border: none; padding: 0.75rem 1rem; border-radius: 5px; font-weight: bold; cursor: pointer; transition: background-color 0.3s ease; }
        .edit-form { flex-grow: 1; }
        .edit-actions button { font-size: 1rem; padding: 0.5rem; border-radius: 5px; color: #1a202c; }
        .edit-actions .save-btn { background-color: #68d391; }
        .edit-actions .cancel-btn { background-color: #a0aec0; }
        #packedMessage { font-size: 1.8rem; color: #a7f3d0; margin-top: 2rem; font-weight: 600; opacity: 0; transition: opacity 1s ease-out; text-shadow: 0 0 10px rgba(167, 243, 208, 0.7); position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000; width: 80%; pointer-events: none; }
        #packedMessage.show { opacity: 1; }
        .confetti, .reunion-particle, .plane-animation-container, .plane-icon { /* styles for animations */ }
      `}</style>
      
      <div className="settings-container">
        <button
          className="settings-button"
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? "Close Settings" : "Set Custom Countdown"}
        </button>
        {showSettings && (
          <form onSubmit={handleSetCountdown} className="settings-form">
            <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
            <input type="time" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} />
            <button type="submit">Set</button>
          </form>
        )}
      </div>

      <div className="countdown-container">
        <h1 className="countdown-title">Journey Malaysia: Arrival Countdown</h1>
        <div id="countdown" className="flex justify-center items-center">
          <div className="countdown-item">
            <span id="hours">{hours}</span>
            <div>Hours</div>
          </div>
          <div className="countdown-item">
            <span id="minutes">{minutes}</span>
            <div>Minutes</div>
          </div>
          <div className="countdown-item">
            <span id="seconds">{seconds}</span>
            <div>Seconds</div>
          </div>
        </div>
        {arrivalMessageShow && (
          <p className="message show">
            The wait is over! Shiro is within your breath
          </p>
        )}
      </div>

      <div className="baggage-container">
        <h2 className="baggage-title">4-Day, 3-Night Baggage Checklist</h2>
        <ul id="baggageList" className="baggage-list">
          {packingList.map((item) => (
            <li key={item.id} className="baggage-list-item">
              {editingItemId === item.id ? (
                <form onSubmit={handleUpdateItem} className="edit-form">
                    <input type="text" value={editingItemText} onChange={(e) => setEditingItemText(e.target.value)} autoFocus />
                    <div className="edit-actions">
                        <button type="submit" className="save-btn">Save</button>
                        <button type="button" onClick={() => setEditingItemId(null)} className="cancel-btn">Cancel</button>
                    </div>
                </form>
              ) : (
                <>
                  <span onClick={() => togglePacked(item.id)} className={`item-text ${item.packed ? "packed" : ""}`} data-item={item.id.split('-')[0]}>
                    {item.text}
                  </span>
                  <div className="item-actions">
                    <button onClick={() => handleStartEdit(item)} title="Edit item">✏️</button>
                    <button onClick={() => handleRemoveItem(item.id)} title="Remove item">🗑️</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        <form onSubmit={handleAddItem} className="item-management-form">
            <input type="text" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder="Add a new item..." />
            <button type="submit">Add</button>
        </form>
      </div>

      {packedMessageShow && (
        <p id="packedMessage" className="message show">
          Congratulations, hardworking person! You're all set!
        </p>
      )}
    </div>
  );
};

export default App;
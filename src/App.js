import React, { useState, useEffect, useRef, useCallback } from "react";

const App = () => {
  // State for countdown values
  const [hours, setHours] = useState("00");
  const [minutes, setMinutes] = useState("00");
  const [seconds, setSeconds] = useState("00");
  // State for celebration messages
  const [arrivalMessageShow, setArrivalMessageShow] = useState(false);
  const [packedMessageShow, setPackedMessageShow] = useState(false);
  // State for animation triggers
  const [showReunionAnimation, setShowReunionAnimation] = useState(false);
  const [playPlaneAnimation, setPlayPlaneAnimation] = useState(false); // Controls the full-screen plane animation
  const [playMapPlaneAnimation, setPlayMapPlaneAnimation] = useState(false); // Controls the map plane animation

  // Refs to manage sound and celebration triggers
  const isArrivalSoundPlayed = useRef(false);
  const isPackedCelebrationTriggered = useRef(false);
  const countdownIntervalRef = useRef(null);

  // Packing list state
  const [packingList, setPackingList] = useState([
    { id: "passport", text: "Passport / ID / Visa (if needed)", packed: false },
    { id: "tickets", text: "Flight Tickets / Boarding Passes", packed: false },
    {
      id: "wallet",
      text: "Wallet / Local Currency / Credit Cards",
      packed: false,
    },
    {
      id: "phone-charger",
      text: "Phone & Charger / Power Bank",
      packed: false,
    },
    { id: "coffee-beans", text: "2 Coffee Beans Pack", packed: false },
    { id: "bible", text: "Bible", packed: false },
    { id: "clothes", text: "Change of Clothes (2 sets)", packed: false },
    { id: "undergarments", text: "Undergarments & Socks", packed: false },
    { id: "sleepwear", text: "Sleepwear", packed: false },
    {
      id: "toiletries",
      text: "Basic Toiletries (toothbrush, toothpaste, small shampoo/conditioner)",
      packed: false,
    },
    { id: "medications", text: "Any necessary Medications", packed: false },
    { id: "towel", text: "Small Towel", packed: false },
    { id: "shoes", text: "Comfortable Walking Shoes", packed: false },
    {
      id: "jacket",
      text: "Light Jacket or Cardigan (for plane/cool evenings)",
      packed: false,
    },
    {
      id: "umbrella",
      text: "Compact Umbrella (for Malaysia's weather)",
      packed: false,
    },
    { id: "adapter", text: "Adapter (if different plug types)", packed: false },
    { id: "day-bag", text: "Small Backpack or Day Bag", packed: false },
    {
      id: "entertainment",
      text: "Book or Entertainment for Travel",
      packed: false,
    },
    { id: "water-bottle", text: "Reusable Water Bottle", packed: false },
  ]);

  // Function to play a simple celebration sound
  const playCelebrationSound = useCallback(() => {
    if (isArrivalSoundPlayed.current) return;
    isArrivalSoundPlayed.current = true;

    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.5,
        audioContext.currentTime + 0.05
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 1.5
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1.5);
    } catch (e) {
      console.error("Web Audio API not supported or error playing sound:", e);
    }
  }, []);

  // Function to create confetti particles
  const createConfetti = useCallback((colors, count = 50) => {
    for (let i = 0; i < count; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.setProperty("--x", `${(Math.random() - 0.5) * 200}px`);
      confetti.style.setProperty("--y", `${(Math.random() - 0.5) * 200}px`);
      confetti.style.setProperty("--x-end", `${(Math.random() - 0.5) * 500}px`);
      confetti.style.setProperty("--y-end", `${window.innerHeight + 100}px`);
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      document.body.appendChild(confetti);

      confetti.addEventListener("animationend", () => {
        confetti.remove();
      });
    }
  }, []);

  // Function to check packing completion and trigger celebration
  const checkPackingCompletion = useCallback(() => {
    const allItemsPacked = packingList.every((item) => item.packed);
    if (allItemsPacked) {
      if (!isPackedCelebrationTriggered.current) {
        isPackedCelebrationTriggered.current = true;
        setPackedMessageShow(true);
        createConfetti(["#a7f3d0", "#f6ad55"], 75); // Green and gold confetti
      }
    } else {
      // If items are unticked, hide the message
      if (isPackedCelebrationTriggered.current) {
        setPackedMessageShow(false);
        isPackedCelebrationTriggered.current = false;
      }
    }
  }, [packingList, createConfetti]);

  // Toggle packed status for a list item
  const togglePacked = useCallback((id) => {
    setPackingList((prevList) => {
      const newList = prevList.map((item) =>
        item.id === id ? { ...item, packed: !item.packed } : item
      );
      localStorage.setItem(
        "packedItems",
        JSON.stringify(
          newList.map((item) => ({ id: item.id, packed: item.packed }))
        )
      );
      return newList;
    });
  }, []);

  // Main countdown logic
  const updateCountdown = useCallback(() => {
    const now = new Date();
    const malaysiaUTCOffset = 8; // GMT+8

    let targetMYT = new Date(now);
    const day = targetMYT.getDay();
    const daysUntilSunday = (0 - day + 7) % 7;

    targetMYT.setDate(targetMYT.getDate() + daysUntilSunday);
    targetMYT.setHours(5, 45, 0, 0);

    if (targetMYT.getTime() < now.getTime()) {
      targetMYT.setDate(targetMYT.getDate() + 7);
    }

    const diff = targetMYT.getTime() - now.getTime();

    if (diff < 0) {
      clearInterval(countdownIntervalRef.current);
      setHours("00");
      setMinutes("00");
      setSeconds("00");
      setArrivalMessageShow(true);
      setShowReunionAnimation(true);
      setPlayPlaneAnimation(true); // Trigger full-screen plane animation
      setPlayMapPlaneAnimation(true); // Trigger map plane animation

      // Trigger arrival celebration effects only once
      if (!isArrivalSoundPlayed.current) {
        playCelebrationSound();
        createConfetti(
          ["#f6ad55", "#a7f3d0", "#63b3ed", "#ffffff", "#cbd5e0"],
          50
        );
      }
    } else {
      setHours(String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0"));
      setMinutes(
        String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(
          2,
          "0"
        )
      );
      setSeconds(
        String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0")
      );
    }
  }, [playCelebrationSound, createConfetti]);

  // Load packing list from localStorage on initial render
  useEffect(() => {
    const storedItems = JSON.parse(localStorage.getItem("packedItems"));
    if (storedItems) {
      setPackingList((currentList) =>
        currentList.map((item) => {
          const storedItem = storedItems.find((sItem) => sItem.id === item.id);
          return storedItem ? { ...item, packed: storedItem.packed } : item;
        })
      );
    }
  }, []);

  // Effect to check packing completion whenever packingList changes
  useEffect(() => {
    checkPackingCompletion();
  }, [packingList, checkPackingCompletion]);

  // Setup countdown interval
  useEffect(() => {
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial call
    return () => clearInterval(countdownIntervalRef.current); // Cleanup on unmount
  }, [updateCountdown]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-8 px-4 bg-gradient-radial overflow-hidden relative">
      <style>{`
                body {
                    font-family: 'Inter', sans-serif;
                    background-image: url('https://images.unsplash.com/photo-1534790566855-4cb788d389ec?ixlib=rb-4.0.3&ixid=M3w1MDcwODR8MHwxfHNlYXJjaHwxfHxuaWdodCUyMG1vdW50YWlucyUyMHNreXxlbnwwfHwxfHwxNzA4MTg1OTY3fDA&auto=format&fit=crop&w=1920&q=80');
                    background-size: cover;
                    background-position: center center;
                    background-repeat: no-repeat;
                    background-attachment: fixed;
                    position: relative; /* For the overlay */
                }

                body::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(42, 67, 101, 0.6); /* Dark blue overlay */
                    z-index: -1; /* Behind content */
                }

                .bg-gradient-radial { /* Kept as fallback if image fails, or could be removed */
                    background: radial-gradient(circle at center, #63b3ed 0%, #3182ce 50%, #2a4365 100%);
                }

                .countdown-container, .baggage-container, .map-section-container { /* Added map container */
                    background-color: rgba(0, 0, 0, 0.5); /* Increased opacity for better visibility */
                    border-radius: 20px;
                    padding: 2.5rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    text-align: center;
                    color: #e2e8f0;
                    backdrop-filter: blur(5px);
                    max-width: 90%;
                    position: relative;
                    margin-bottom: 2rem;
                    animation: fadeIn 1s ease-out forwards;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .countdown-title, .baggage-title, .map-title { /* Added map title */
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 2rem;
                    color: #ffffff;
                    text-shadow: 0 0 15px rgba(255, 255, 255, 0.8), 0 0 25px rgba(99, 179, 237, 0.7);
                    animation: fadeIn 1s ease-out forwards 0.5s;
                }

                .countdown-item {
                    display: inline-block;
                    margin: 0 1.5rem;
                    position: relative;
                    animation: fadeIn 1s ease-out forwards 1s;
                }

                .countdown-item span {
                    display: block;
                    font-size: 5rem;
                    font-weight: 700;
                    color: #a7f3d0;
                    text-shadow: 0 0 15px rgba(167, 243, 208, 0.8);
                    min-width: 120px;
                    text-align: center;
                    line-height: 1;
                    animation: pulseGlow 2s infinite alternate;
                }

                .countdown-item div {
                    font-size: 1.25rem;
                    color: #cbd5e0;
                    margin-top: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .message {
                    font-size: 1.8rem;
                    color: #f6ad55;
                    margin-top: 3rem;
                    font-weight: 600;
                    opacity: 0;
                    transition: opacity 1s ease-out;
                    text-shadow: 0 0 10px rgba(246, 173, 85, 0.7);
                    animation: fadeIn 1s ease-out forwards 1.5s;
                }

                .message.show {
                    opacity: 1;
                }

                .baggage-list {
                    list-style: none;
                    padding: 0;
                    text-align: left;
                    margin: 0 auto;
                    max-width: 400px;
                }

                .baggage-list li {
                    font-size: 1.1rem;
                    margin-bottom: 0.75rem;
                    color: #e2e8f0;
                    position: relative;
                    padding-left: 1.8rem;
                    cursor: pointer;
                    transition: color 0.3s ease, text-decoration 0.3s ease;
                }

                .baggage-list li::before {
                    position: absolute;
                    left: 0;
                    color: #a7f3d0;
                    font-size: 1.3rem;
                    line-height: 1;
                }

                /* Specific icons based on data-item attribute */
                .baggage-list li[data-item="passport"]::before { content: '🛂'; }
                .baggage-list li[data-item="tickets"]::before { content: '✈️'; }
                .baggage-list li[data-item="wallet"]::before { content: '💰'; }
                .baggage-list li[data-item="phone-charger"]::before { content: '📱'; }
                .baggage-list li[data-item="coffee-beans"]::before { content: '☕'; }
                .baggage-list li[data-item="bible"]::before { content: '📖'; }
                .baggage-list li[data-item="clothes"]::before { content: '👕'; }
                .baggage-list li[data-item="undergarments"]::before { content: '🩲'; }
                .baggage-list li[data-item="sleepwear"]::before { content: '🛌'; }
                .baggage-list li[data-item="toiletries"]::before { content: '🧴'; }
                .baggage-list li[data-item="medications"]::before { content: '💊'; }
                .baggage-list li[data-item="towel"]::before { content: '🧖‍♀️'; }
                .baggage-list li[data-item="shoes"]::before { content: '👟'; }
                .baggage-list li[data-item="jacket"]::before { content: '🧥'; }
                .baggage-list li[data-item="umbrella"]::before { content: '☔'; }
                .baggage-list li[data-item="adapter"]::before { content: '🔌'; }
                .baggage-list li[data-item="day-bag"]::before { content: '🎒'; }
                .baggage-list li[data-item="entertainment"]::before { content: '📚'; }
                .baggage-list li[data-item="water-bottle"]::before { content: '💧'; }
                /* Default to sparkle if no specific content is matched */
                .baggage-list li:not([data-item])::before { content: '✨'; }


                .baggage-list li.packed {
                    text-decoration: line-through;
                    color: #a0aec0;
                    opacity: 0.7;
                }

                @keyframes pulseGlow {
                    from { text-shadow: 0 0 15px rgba(167, 243, 208, 0.8); }
                    to { text-shadow: 0 0 25px rgba(167, 243, 208, 1); }
                }

                .reunion-particle {
                    position: absolute;
                    width: 30px;
                    height: 30px;
                    background-color: #f6ad55;
                    border-radius: 50%;
                    opacity: 0;
                    box-shadow: 0 0 20px #f6ad55;
                    z-index: 5;
                }

                .reunion-particle-1 {
                    left: -50px;
                    top: 50%;
                    transform: translateY(-50%);
                    animation: moveParticle1 2s forwards ease-out 0.5s;
                }

                .reunion-particle-2 {
                    right: -50px;
                    top: 50%;
                    transform: translateY(-50%);
                    animation: moveParticle2 2s forwards ease-out 0.5s;
                }

                @keyframes moveParticle1 {
                    0% { left: -50px; opacity: 0; }
                    50% { left: calc(50% - 20px); opacity: 1; }
                    100% { left: calc(50% - 20px); opacity: 1; }
                }

                @keyframes moveParticle2 {
                    0% { right: -50px; opacity: 0; }
                    50% { right: calc(50% - 20px); opacity: 1; }
                    100% { right: calc(50% - 20px); opacity: 1; }
                }

                .reunion-glow {
                    animation: glowPulse 2s infinite alternate;
                }

                @keyframes glowPulse {
                    0% { transform: scale(1); box-shadow: 0 0 20px #f6ad55; }
                    100% { transform: scale(1.2); box-shadow: 0 0 40px #f6ad55, 0 0 60px rgba(246, 173, 85, 0.5); }
                }

                .confetti {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background-color: transparent;
                    border-radius: 50%;
                    opacity: 0;
                    animation: confetti-fall 3s ease-out forwards;
                    pointer-events: none;
                    z-index: 9999;
                }

                @keyframes confetti-fall {
                    0% { transform: translate(var(--x), var(--y)) rotate(0deg); opacity: 1; }
                    100% { transform: translate(var(--x-end), var(--y-end)) rotate(720deg); opacity: 0; }
                }

                #packedMessage {
                    font-size: 1.8rem;
                    color: #a7f3d0;
                    margin-top: 2rem;
                    font-weight: 600;
                    opacity: 0;
                    transition: opacity 1s ease-out;
                    text-shadow: 0 0 10px rgba(167, 243, 208, 0.7);
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 10000;
                    width: 80%;
                    pointer-events: none;
                }

                #packedMessage.show {
                    opacity: 1;
                }

                /* Full-screen Plane Animation Styles */
                .plane-animation-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    overflow: hidden;
                    pointer-events: none;
                    z-index: 99;
                }

                .plane-icon {
                    position: absolute;
                    font-size: 3rem;
                    animation: none;
                    opacity: 0;
                    transform: translate(-50%, -50%);
                    color: #ffffff;
                    text-shadow: 0 0 10px rgba(255,255,255,0.7);
                }

                @keyframes flyPlane {
                    0% { left: 10%; top: 10%; opacity: 0; transform: translate(-50%, -50%) rotate(0deg); }
                    10% { opacity: 1; }
                    90% { left: 90%; top: 90%; opacity: 1; }
                    100% { left: 100%; top: 100%; opacity: 0; transform: translate(-50%, -50%) rotate(45deg); }
                }

                .plane-icon.active {
                    animation: flyPlane 5s forwards ease-in-out;
                }

                /* Map Section Styles */
                .map-section-container {
                    margin-top: 2rem;
                    width: 100%;
                }

                .map-display {
                    position: relative;
                    width: 100%;
                    max-width: 800px; /* Max width for map */
                    margin: 0 auto;
                    aspect-ratio: 16/9; /* Maintain aspect ratio */
                    overflow: hidden;
                    border-radius: 15px;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
                    background-color: #333; /* Fallback for map image loading */
                }

                .map-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover; /* Cover the map area */
                    display: block;
                }

                .map-plane-icon {
                    position: absolute;
                    font-size: 2rem; /* Smaller plane for map */
                    color: #f6ad55; /* Orange to stand out */
                    text-shadow: 0 0 8px rgba(246, 173, 85, 0.8);
                    opacity: 0;
                    animation: none;
                    transform: translate(-50%, -50%) rotate(0deg); /* Initial position and rotation */
                    transition: opacity 0.5s ease-in-out; /* Smooth fade-in */
                }

                @keyframes flyMapPlane {
                    0% { left: 70%; top: 20%; opacity: 0; transform: translate(-50%, -50%) rotate(-30deg); }
                    10% { opacity: 1; }
                    90% { left: 45%; top: 75%; opacity: 1; }
                    100% { left: 45%; top: 75%; opacity: 0; transform: translate(-50%, -50%) rotate(-30deg); } /* Ends at Malaysia, then fades out */
                }

                .map-plane-icon.active {
                    animation: flyMapPlane 4s forwards ease-in-out 0.5s; /* Slightly delayed from main plane */
                }

                .map-label {
                    position: absolute;
                    font-size: 0.9rem;
                    color: #ffffff;
                    font-weight: bold;
                    text-shadow: 0 0 5px rgba(0,0,0,0.7);
                    background-color: rgba(0,0,0,0.3);
                    padding: 0.2rem 0.5rem;
                    border-radius: 5px;
                }

                .korea-label {
                    top: 15%;
                    left: 65%;
                    transform: translateX(-50%);
                }

                .malaysia-label {
                    top: 80%;
                    left: 40%;
                    transform: translateX(-50%);
                }


                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .countdown-container, .baggage-container, .map-section-container {
                        padding: 1.5rem;
                        margin-bottom: 1.5rem;
                    }
                    .countdown-title, .baggage-title, .map-title {
                        font-size: 1.8rem;
                        margin-bottom: 1.5rem;
                    }
                    .countdown-item {
                        margin: 0 0.8rem;
                    }
                    .countdown-item span {
                        font-size: 3.5rem;
                        min-width: 80px;
                    }
                    .countdown-item div {
                        font-size: 1rem;
                    }
                    .message {
                        font-size: 1.4rem;
                        margin-top: 2rem;
                    }
                    .reunion-particle {
                        width: 20px;
                        height: 20px;
                    }
                    .baggage-list li {
                        font-size: 1rem;
                    }
                    #packedMessage {
                        font-size: 1.4rem;
                    }
                    .plane-icon {
                        font-size: 2rem;
                    }
                    .map-plane-icon {
                        font-size: 1.5rem;
                    }
                    .map-label {
                        font-size: 0.75rem;
                        padding: 0.15rem 0.4rem;
                    }
                }

                @media (max-width: 480px) {
                    .countdown-item {
                        margin: 0 0.5rem;
                    }
                    .countdown-item span {
                        font-size: 2.5rem;
                        min-width: 60px;
                    }
                    .countdown-item div {
                        font-size: 0.8rem;
                    }
                    .baggage-list li {
                        font-size: 0.9rem;
                    }
                }
            `}</style>

      <div className="countdown-container">
        <h1 className="countdown-title">Journey Home: Arrival Countdown</h1>
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
            The wait is over! Welcome home, my dearest!
          </p>
        )}
      </div>

      <div className="baggage-container">
        <h2 className="baggage-title">2-Day, 1-Night Baggage Checklist</h2>
        <ul id="baggageList" className="baggage-list">
          {packingList.map((item) => (
            <li
              key={item.id}
              data-item={item.id}
              className={item.packed ? "packed" : ""}
              onClick={() => togglePacked(item.id)}
            >
              {item.icon} {item.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Message for packed items celebration */}
      {packedMessageShow && (
        <p id="packedMessage" className="message-overlay show">
          Congratulations, hardworking person! You're all set!
        </p>
      )}

      {/* Map Section */}
      <div className="map-section-container">
        <h2 className="map-title">Flight Path Overview</h2>
        <div className="map-display">
          {/* Updated Map image URL to a more general political map of Asia. */}
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Map_of_Asia_%28political%29.svg/1280px-Map_of_Asia_%28political%29.svg.png"
            alt="Map of Asia"
            className="map-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://placehold.co/1280x720/333/fff?text=Map+Not+Loaded";
            }} // Fallback image
          />
          <span
            role="img"
            aria-label="flying-plane"
            className={`map-plane-icon ${
              playMapPlaneAnimation ? "active" : ""
            }`}
          >
            ✈️
          </span>
          <div className="map-label korea-label">South Korea</div>
          <div className="map-label malaysia-label">Malaysia</div>
        </div>
      </div>

      {/* Reunion Particles */}
      {showReunionAnimation && (
        <div className="reunion-animation-container">
          <div className="reunion-particle reunion-particle-1"></div>
          <div className="reunion-particle reunion-particle-2"></div>
        </div>
      )}

      {/* Full-screen Plane Animation - this is the original one */}
      <div className="plane-animation-container">
        <span
          role="img"
          aria-label="airplane"
          className={`plane-icon ${playPlaneAnimation ? "active" : ""}`}
        >
          ✈️
        </span>
      </div>
    </div>
  );
};

export default App;

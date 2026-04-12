# 🍔 Baxter's Burgers & Fries

A fast-paced, mobile-first browser game where you run a burger joint. Take orders from waiting customers, build them correctly, and serve them before they walk out — all while keeping your store rating up.

**[Play now on GitHub Pages](https://golden-vibe-coder.github.io/food-game/)**

---

## About

Baxter's Burgers & Fries is a vanilla JavaScript browser game with no frameworks or build tools. The UI is designed mobile-first — it's meant to be played on a phone.

Players manage a customer queue, assemble orders from a menu, and serve customers by tapping. Speed matters: the faster you serve, the more your store rating climbs. Wrong orders and customers walking out both hurt your rating.

---

## Features

- 4-item menu with distinct pricing (Burger, Fries, Milkshake, Fried Pickles)
- Up to 4 waiting customers with live mood indicators (😊 → 😐 → 😠)
- 30-second customer timer before they leave
- Order quantity grouping — repeated items stack into a single pill with a badge
- Star rating system (0–5) that rewards speed and penalizes mistakes
- Pause / Resume game support
- Sound effects on successful serve and wrong order
- Responsive layout: 2-column desktop, streamlined single-column mobile

---

## How to Play

See [`game-rules.txt`](game-rules.txt) for the full rules breakdown, including exact rating math.

**Quick start:**
1. Click **Start Game**
2. Tap menu items to build the order shown on a waiting customer
3. Tap the customer to serve them
4. Keep the queue moving — don't let customers time out

---

## Tech Stack

- **HTML / CSS / JavaScript** — no frameworks, no build step
- **CSS custom properties** for responsive order display sizing
- **Mobile-first CSS** with `min-width` breakpoints (481px tablet, 769px desktop)
- Hosted on **GitHub Pages**

---

## Project Structure

```
food-game/
├── index.html              # Game markup
├── style.css               # Mobile-first styles
├── game.js                 # All game logic
├── game-rules.txt          # Plain-language rules reference
├── Icons/
│   └── icons8-dachshund-64.png   # Favicon / app icon
└── Mixkit Sound Files/
    ├── mixkit-fairy-arcade-sparkle-866.wav   # Successful serve
    └── mixkit-losing-bleeps-2026.wav         # Wrong order
```

---

## Running Locally

No build step required. Just open `index.html` in a browser:

```bash
# Option 1 — open directly
open food-game/index.html

# Option 2 — serve locally (avoids any audio autoplay restrictions)
npx serve food-game
```

---

## Attribution

- [Dachshund icon](https://icons8.com/icon/nuAYQzjoNfV3/dachshund) by [Icons8](https://icons8.com)
- Sound effects from [Mixkit](https://mixkit.co/free-sound-effects/)

# Joker Chaser

---

## 🛠 Project Environment
* **Engine:** Cocos Creator 3.8.8
* **Language:** TypeScript
* **Platform Support:** Web Desktop, Web Mobile, Android, iOS

---

## 🚀 Quick Start

To ensure all game managers and global states initialize correctly, please follow the execution flow below:

1.  **Open Project:** Add the project folder to your **Cocos Dashboard** and open it with version **3.8.8**.
2.  **Locate Entry Scene:** Go to the `assets/` folder in the Assets panel.
3.  **Run the Game:** * Open the scene named **`Bootstrap`**.
    * Press the **Play** button at the top of the Cocos Creator editor.

> [!IMPORTANT]  
> Always start the game from the **Bootstrap** scene. Running other scenes directly may result in null reference errors due to missing global initializations.

---

## ⚖️ Game Modes & Mechanics

The game transitions from a standard strategic battle into a high-intensity survival mode after a set number of rounds.

| Feature | Normal Game | Sudden Death (Round 20+) |
| :--- | :--- | :--- |
| **Primary Goal** | Use 13 shuffled cards to be the last man standing. | Immediate elimination if you lose the round. |
| **Card Sorting** | Lower values move to front ($A > K$). | Same sorting rules apply. |
| **Same Card Rule** | Same cards = No movement/position change. (if all alive player play the same card, no one take damage) | Same cards = No movement/position change. (if all alive player play the same card, all player will die) |
| **Card Refresh** | Cards are dealt back after playing all 13. | **No card refresh.** Once used, they are gone. |
| **Turn Timer** | 30 Seconds | **10 Seconds** |
| **Health System** | Standard Healthbar visible. | **Healthbar removed** (Instant Death). |

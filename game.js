const GAME_CONFIG={
    customerSpawnInterval:5000,
    maxCustomers:4,
    // Controls how many customer slots are visible in the UI; maxCustomers is the total number of customer slots tracked by the game.
    visibleCustomerSlots:2,
    ingredients:{
        burger:{emoji:'🍔',value:15},
        fries:{emoji:'🍟',value:7},
        milkshake:{emoji:'🥤',value:9},
        friedpickles:{emoji:'🥒',value:3,name:'Fried Pickles'}
    },
    customerNames:[
        'Alex',
        'Jordan',
        'Casey',
        'Morgan',
        'Riley',
        'Jamie',
        'Sam',
        'Charlie',
        'Taylor',
        'Quinn',
        'Drew',
        'Avery',
        'Blake',
        'Sage',
        'Reese',
        'Parker'
    ]
};
let gameState={isRunning:false,isPaused:false,totalMoney:0,ordersCompleted:0,currentOrder:[],customers:Array(GAME_CONFIG.maxCustomers).fill(null),nextCustomerId:0,spawnInterval:null,rating:0,ordersMissed:0,expireCheckInterval:null};
class Customer {
    constructor(id, namePool) {
        this.id = id;
        const pool = namePool && namePool.length > 0 ? namePool : GAME_CONFIG.customerNames;
        this.name = pool[Math.floor(Math.random() * pool.length)];
        this.order = this.generateRandomOrder();
        this.payAmount = this.calculatePayAmount();
        this.emoji = '😊';
        this.spawnTime = Date.now();
    }

    generateRandomOrder() {
        const ingredients = Object.keys(GAME_CONFIG.ingredients);
        const orderSize = Math.floor(Math.random() * 3) + 1;
        const order = [];

        for (let i = 0; i < orderSize; i++) {
            const ingredient = ingredients[Math.floor(Math.random() * ingredients.length)];
            order.push(ingredient);
        }

        return order;
    }

    calculatePayAmount() {
        let total = 0;

        for (const ingredient of this.order) {
            total += GAME_CONFIG.ingredients[ingredient].value;
        }

        return total;
    }

    getOrderIcons() {
        return this.order.map(item => GAME_CONFIG.ingredients[item].emoji).join(' ');
    }

    getMood() {
        const waitTime = (Date.now() - this.spawnTime) / 1000;

        if (waitTime < 5) return 0;
        if (waitTime < 15) return 1;
        return 2;
    }

    isExpired() {
        return (Date.now() - this.spawnTime) > 30000;
    }
}
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const orderPlaceholderText = isTouchDevice ? 'Tap menu items to build an order' : 'Click menu items to build an order';

const SESSION_COOKIE = 'foodGameSession';

function saveSession() {
    const data = {
        totalMoney: gameState.totalMoney,
        ordersCompleted: gameState.ordersCompleted,
        ordersMissed: gameState.ordersMissed,
        rating: gameState.rating
    };
    document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(JSON.stringify(data))};path=/;SameSite=Strict;max-age=31536000`;
}

function loadSession() {
    const match = document.cookie.split('; ').find(row => row.startsWith(`${SESSION_COOKIE}=`));
    if (!match) return null;
    try {
        return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
    } catch (e) {
        return null;
    }
}

function hasSession() {
    return document.cookie.split('; ').some(row => row.startsWith(`${SESSION_COOKIE}=`));
}
function initGame() {
    gameState.isRunning = false;
    gameState.totalMoney = 0;
    gameState.ordersCompleted = 0;
    gameState.currentOrder = [];
    gameState.customers = Array(GAME_CONFIG.maxCustomers).fill(null);
    gameState.nextCustomerId = 0;
    gameState.rating = 0;
    gameState.ordersMissed = 0;
    if (gameState.expireCheckInterval) clearInterval(gameState.expireCheckInterval);
    updateUI();
}

function startGame() {
    if (gameState.isRunning && !gameState.isPaused) return;

    if (!gameState.isRunning) {
        gameState.isRunning = true;
        gameState.isPaused = false;
        saveSession();
        spawnCustomer();
    } else if (gameState.isPaused) {
        gameState.isPaused = false;
    }

    gameState.spawnInterval = setInterval(() => {
        if (gameState.isRunning && !gameState.isPaused) spawnCustomer();
    }, GAME_CONFIG.customerSpawnInterval);

    gameState.expireCheckInterval = setInterval(() => {
        if (gameState.isRunning && !gameState.isPaused) checkExpiredCustomers();
    }, 500);

    document.getElementById('start-btn').textContent = 'Pause Game';
    setIngredientButtonsDisabled(false);
}

function pauseGame() {
    gameState.isPaused = true;
    if (gameState.spawnInterval) clearInterval(gameState.spawnInterval);
    if (gameState.expireCheckInterval) clearInterval(gameState.expireCheckInterval);
    document.getElementById('start-btn').textContent = 'Resume Game';
    setIngredientButtonsDisabled(true);
}

function setIngredientButtonsDisabled(disabled) {
    document.querySelectorAll('.ingredient-btn').forEach(btn => {
        btn.disabled = disabled;
    });
}

function spawnCustomer() {
    const slotIndex = gameState.customers.indexOf(null);
    if (slotIndex === -1) return;

    const usedNames = gameState.customers.filter(c => c !== null).map(c => c.name);
    const availableNames = GAME_CONFIG.customerNames.filter(n => !usedNames.includes(n));
    const customer = new Customer(gameState.nextCustomerId++, availableNames);
    gameState.customers[slotIndex] = customer;
    updateUI();
}

function selectIngredient(ingredient) {
    if (!gameState.isRunning || gameState.isPaused) return;
    gameState.currentOrder.push(ingredient);
    updateUI();
}

function clearOrder() {
    gameState.currentOrder = [];
    updateUI();
}

function serveCustomer(customerId) {
    if (!gameState.isRunning || gameState.isPaused) return;

    const customerIndex = gameState.customers.findIndex(c => c && c.id === customerId);
    if (customerIndex === -1) return;

    const customer = gameState.customers[customerIndex];
    if (customer.served) return;

    const customerOrderSorted = [...customer.order].sort();
    const currentOrderSorted = [...gameState.currentOrder].sort();

    if (arraysEqual(customerOrderSorted, currentOrderSorted)) {
        gameState.totalMoney += customer.payAmount;
        gameState.ordersCompleted++;

        const timeTaken = (Date.now() - customer.spawnTime) / 1000;
        // Reward scaling from game-rules.txt: a 1-item order starts at 0.5, and each additional item adds 0.25.
        const sizeMultiplier = 0.5 + (customer.order.length - 1) * 0.25;
        const reward = Math.max(0.03, (1.0 - (timeTaken / 30) * 0.97) * sizeMultiplier);
        gameState.rating = Math.min(5, gameState.rating + reward);
        gameState.currentOrder = [];
        gameState.customers[customerIndex].served = true;

        const chachingSound = document.getElementById('cha-ching-sound');
        if (chachingSound) {
            chachingSound.currentTime = 0;
            chachingSound.play().catch(() => {});
        }

        const slot = document.getElementById(`slot-${customerIndex}`);
        showFeedbackOnCustomer(slot, `$${customer.payAmount}`);
        setTimeout(() => {
            gameState.customers[customerIndex] = null;
            promoteCustomers();
            updateUI();
        }, 1500);
    } else {
        const orderSize = customer.order.length;
        const penalty = -0.09 + (orderSize / 20) * 0.08;
        gameState.rating = Math.max(0, gameState.rating + penalty);
        gameState.ordersMissed++;

        const angryCrowdSound = document.getElementById('angry-crowd-sound');
        if (angryCrowdSound) {
            angryCrowdSound.currentTime = 0;
            angryCrowdSound.play().catch(() => {});
        }

        const slot = document.getElementById(`slot-${customerIndex}`);
        showFeedbackOnCustomer(slot, '👎', true);
        setTimeout(() => {
            gameState.customers[customerIndex] = null;
            promoteCustomers();
            updateUI();
        }, 1500);
    }
}

function showFeedbackOnCustomer(slot, message, isError = false) {
    const feedback = document.createElement('div');
    feedback.className = 'customer-feedback';
    if (isError) feedback.classList.add('error');
    feedback.textContent = message;
    slot.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

function promoteCustomers() {
    for (let visible = 0; visible < GAME_CONFIG.visibleCustomerSlots; visible++) {
        if (gameState.customers[visible] === null) {
            for (let hidden = GAME_CONFIG.visibleCustomerSlots; hidden < GAME_CONFIG.maxCustomers; hidden++) {
                if (gameState.customers[hidden] !== null) {
                    gameState.customers[visible] = gameState.customers[hidden];
                    gameState.customers[hidden] = null;
                    break;
                }
            }
        }
    }
}

function checkExpiredCustomers() {
    let updated = false;
    for (let i = 0; i < gameState.customers.length; i++) {
        if (gameState.customers[i] && gameState.customers[i].isExpired()) {
            const customer = gameState.customers[i];
            const orderSize = customer.order.length;
            const penalty = -0.09 + (orderSize / 20) * 0.08;
            gameState.rating = Math.max(0, gameState.rating + penalty);
            gameState.ordersMissed++;
            gameState.customers[i] = null;
            updated = true;
        }
    }
    if (updated) {
        promoteCustomers();
        updateUI();
    }
}

function renderStars() {
    const rating = gameState.rating;
    let html = '';
    for (let i = 0; i < 5; i++) {
        const starFill = Math.max(0, Math.min(1, rating - i));
        if (starFill >= 0.99) {
            html += '<span class="star filled">★</span>';
        } else if (starFill > 0.01) {
            const fillPercent = (starFill * 100).toFixed(0);
            const partialStyle = [
                `background:linear-gradient(90deg,#ffc107 ${fillPercent}%,#ddd ${fillPercent}%)`,
                '-webkit-background-clip:text',
                '-webkit-text-fill-color:transparent',
                'background-clip:text'
            ].join(';');
            html += `<span class="star" style="${partialStyle}">★</span>`;
        } else {
            html += '<span class="star">★</span>';
        }
    }
    return html;
}

function updateUI() {
    if (hasSession()) saveSession();
    document.getElementById('earnings').textContent = `$${gameState.totalMoney}`;
    document.getElementById('orders-completed').textContent = gameState.ordersCompleted;
    document.getElementById('orders-missed').textContent = gameState.ordersMissed;

    const starRatingEl = document.getElementById('star-rating');
    starRatingEl.innerHTML = renderStars();
    starRatingEl.title = gameState.rating.toFixed(2) + '/5.00';

    const orderDisplay = document.getElementById('order-display');
    const newCounts = {};
    for (const item of gameState.currentOrder) {
        newCounts[item] = (newCounts[item] || 0) + 1;
    }

    const existingPills = {};
    orderDisplay.querySelectorAll('.order-item[data-item]').forEach(el => {
        existingPills[el.dataset.item] = el;
    });

    if (gameState.currentOrder.length === 0) {
        if (!orderDisplay.querySelector('.placeholder')) {
            orderDisplay.innerHTML = `<p class="placeholder">${orderPlaceholderText}</p>`;
        }
    } else {
        const placeholder = orderDisplay.querySelector('.placeholder');
        if (placeholder) placeholder.remove();

        for (const item of Object.keys(existingPills)) {
            if (!newCounts[item]) {
                existingPills[item].remove();
                delete existingPills[item];
            }
        }

        for (const [item, qty] of Object.entries(newCounts)) {
            if (existingPills[item]) {
                const pill = existingPills[item];
                const qtyEl = pill.querySelector('.order-qty');
                if (qty > 1) {
                    if (qtyEl) {
                        qtyEl.textContent = `×${qty}`;
                    } else {
                        const span = document.createElement('span');
                        span.className = 'order-qty';
                        span.textContent = `×${qty}`;
                        pill.appendChild(span);
                    }
                } else {
                    if (qtyEl) qtyEl.remove();
                }
            } else {
                const div = document.createElement('div');
                div.className = `order-item ${item}`;
                div.dataset.item = item;
                const ingredientConfig = GAME_CONFIG.ingredients[item];
                const label = ingredientConfig.name || item.charAt(0).toUpperCase() + item.slice(1);
                div.innerHTML = `<span>${ingredientConfig.emoji}</span>${label}`;
                if (qty > 1) {
                    const span = document.createElement('span');
                    span.className = 'order-qty';
                    span.textContent = `×${qty}`;
                    div.appendChild(span);
                }
                orderDisplay.appendChild(div);
            }
        }
    }

    renderCustomers();
}

function renderCustomers() {
    for (let i = 0; i < GAME_CONFIG.maxCustomers; i++) {
        const slot = document.getElementById(`slot-${i}`);
        const customer = gameState.customers[i];

        if (customer) {
            const moods = ['😊', '😐', '😠'];
            const moodEmoji = moods[customer.getMood()];
            slot.innerHTML = `
                <div class="customer-info">
                    <div class="customer">${moodEmoji}</div>
                    <div class="customer-name">${customer.name}</div>
                </div>
                <div class="order-icons">${customer.getOrderIcons()}</div>
            `;
            slot.classList.remove('empty', 'tapped');
            slot.style.opacity = customer.served ? '0.5' : '1';
            slot.style.cursor = 'pointer';

            slot.ontouchstart = function () { this.classList.add('tapped'); };
            slot.ontouchend = null;
            slot.ontouchcancel = function () { this.classList.remove('tapped'); };
            slot.onclick = function () {
                serveCustomer(customer.id);
                this.blur();
            };
        } else {
            slot.innerHTML = '';
            slot.classList.add('empty');
            slot.classList.remove('tapped');
            slot.style.cursor = 'default';
            slot.onclick = null;
            slot.ontouchstart = null;
            slot.ontouchend = null;
            slot.ontouchcancel = null;
        }
    }
}

function showMoneyPopup(amount) {
    const popup = document.createElement('div');
    popup.className = 'money-popup';
    popup.textContent = `+$${amount}`;
    const x = window.innerWidth / 2 + (Math.random() - 0.5) * 100;
    const y = window.innerHeight / 2;
    popup.style.left = x + 'px';
    popup.style.top = y + 'px';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
}

function resetGame() {
    if (gameState.spawnInterval) clearInterval(gameState.spawnInterval);
    if (gameState.expireCheckInterval) clearInterval(gameState.expireCheckInterval);
    gameState.isPaused = false;
    initGame();
    saveSession();
    document.getElementById('start-btn').textContent = 'Start Game';
    document.getElementById('start-btn').disabled = false;
    setIngredientButtonsDisabled(false);
}

document.addEventListener('DOMContentLoaded', () => {
    initGame();

    const savedSession = loadSession();
    if (savedSession) {
        gameState.totalMoney = savedSession.totalMoney ?? 0;
        gameState.ordersCompleted = savedSession.ordersCompleted ?? 0;
        gameState.ordersMissed = savedSession.ordersMissed ?? 0;
        gameState.rating = savedSession.rating ?? 0;
        updateUI();
    }

    document.getElementById('start-btn').addEventListener('click', () => {
        if (gameState.isRunning && !gameState.isPaused) {
            pauseGame();
        } else {
            startGame();
        }
    });

    document.getElementById('reset-btn').addEventListener('click', resetGame);

    document.querySelectorAll('.ingredient-btn:not(#clear-btn)').forEach(btn => {
        btn.addEventListener('click', () => {
            const ingredient = btn.dataset.ingredient;
            selectIngredient(ingredient);
        });
    });

    document.getElementById('clear-btn').addEventListener('click', clearOrder);
});

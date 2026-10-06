/**
 * Order Alert & Sound Notifier for Choshma Zone Admin PWA
 * - Synthesizes an authentic "Cha-Ching!" cash register bell + coin rattle chime using Web Audio API
 * - Triggers device vibration patterns
 * - Sends browser push notifications
 * - Auto-unlocks AudioContext on first user interaction for mobile Chrome/Safari compatibility
 */

let audioCtx = null;
let isAudioUnlocked = false;

/**
 * Get or initialize Web AudioContext safely
 */
const getAudioContext = () => {
    if (!audioCtx && typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
};

/**
 * Unlock AudioContext on first user gesture (touch, click, keydown)
 * Necessary for mobile iOS Safari & Android Chrome autoplay policies.
 */
export const unlockAudio = () => {
    if (isAudioUnlocked || typeof window === 'undefined') return;

    const unlockHandler = () => {
        try {
            const ctx = getAudioContext();
            if (ctx) {
                // Play a brief inaudible buffer to officially satisfy browser gesture requirement
                const buffer = ctx.createBuffer(1, 1, 22050);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(0);

                if (ctx.state === 'suspended') {
                    ctx.resume();
                }
                isAudioUnlocked = true;
            }
        } catch (e) {
            console.warn('AudioContext unlock attempt:', e);
        }

        // Clean up listeners once unlocked
        ['touchstart', 'touchend', 'click', 'keydown'].forEach(evt => {
            window.removeEventListener(evt, unlockHandler);
        });
    };

    ['touchstart', 'touchend', 'click', 'keydown'].forEach(evt => {
        window.addEventListener(evt, unlockHandler, { once: true, passive: true });
    });
};

// Reusable Audio instance preloaded for instant zero-latency playback
let preloadedAudio = null;
if (typeof window !== 'undefined') {
    try {
        preloadedAudio = new Audio('/sounds/kaching.mp3');
        preloadedAudio.preload = 'auto';
        preloadedAudio.volume = 1.0;
    } catch (e) {
        // Fallback for non-browser environments
    }
}

/**
 * Play authentic Cash Register (Kaching) sound
 * 1. Plays authentic recorded Cash Register (Kaching) MP3
 * 2. Falls back to Web Audio API synthesis if MP3 playback fails
 */
export const playKachingSound = () => {
    let mp3Played = false;

    try {
        // Create fresh Audio instance or use preloaded to allow rapid successive plays
        const audio = new Audio('/sounds/kaching.mp3');
        audio.volume = 1.0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                mp3Played = true;
            }).catch((err) => {
                console.warn('Audio element play restricted or failed, using Web Audio synthesizer:', err);
                synthesizeKachingSound();
            });
        }
    } catch (err) {
        synthesizeKachingSound();
    }
};

// Alias for backwards compatibility
export const playChaChingSound = playKachingSound;

/**
 * Synthesize a high-fidelity Cash Register "Kaching!" chime using Web Audio API
 */
const synthesizeKachingSound = () => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // Master output gain
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.9, now);
        masterGain.connect(ctx.destination);

        // --- 1. THE CASH REGISTER BELL ("DING!") ---
        const bellFrequencies = [2349, 3520, 4698];
        const bellGains = [0.45, 0.25, 0.15];

        bellFrequencies.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.exponentialRampToValueAtTime(bellGains[idx], now + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start(now);
            osc.stop(now + 1.3);
        });

        // --- 2. THE MECHANICAL DRAWER POP / CLICK (at t = 0) ---
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(450, now);
        clickOsc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

        clickGain.gain.setValueAtTime(0.3, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        clickOsc.connect(clickGain);
        clickGain.connect(masterGain);

        clickOsc.start(now);
        clickOsc.stop(now + 0.05);

        // --- 3. COIN CLINK CASCADE ---
        const coinDrops = [
            { time: now + 0.09, startFreq: 3400, endFreq: 3000, vol: 0.2 },
            { time: now + 0.17, startFreq: 4100, endFreq: 3700, vol: 0.25 },
            { time: now + 0.26, startFreq: 3800, endFreq: 3300, vol: 0.18 }
        ];

        coinDrops.forEach(coin => {
            const coinOsc = ctx.createOscillator();
            const coinGain = ctx.createGain();

            coinOsc.type = 'sine';
            coinOsc.frequency.setValueAtTime(coin.startFreq, coin.time);
            coinOsc.frequency.exponentialRampToValueAtTime(coin.endFreq, coin.time + 0.06);

            coinGain.gain.setValueAtTime(0.001, coin.time);
            coinGain.gain.exponentialRampToValueAtTime(coin.vol, coin.time + 0.003);
            coinGain.gain.exponentialRampToValueAtTime(0.0001, coin.time + 0.07);

            coinOsc.connect(coinGain);
            coinGain.connect(masterGain);

            coinOsc.start(coin.time);
            coinOsc.stop(coin.time + 0.08);
        });
    } catch (err) {
        console.warn('Could not synthesize Kaching sound:', err);
    }
};

/**
 * Trigger mobile phone vibration pattern
 * Pattern: [200ms buzz, 100ms pause, 200ms buzz, 100ms pause, 400ms triumphant buzz]
 */
export const vibratePhone = () => {
    try {
        if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 400]);
        }
    } catch (err) {
        console.warn('Vibration not supported or denied:', err);
    }
};

/**
 * Request Browser Notification permission
 * @returns {Promise<'granted'|'denied'|'default'>}
 */
export const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'denied';
    }

    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (err) {
        console.error('Error requesting notification permission:', err);
        return Notification.permission || 'denied';
    }
};

/**
 * Check if notifications are allowed
 */
export const isNotificationPermissionGranted = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'granted';
};

/**
 * Trigger full order alert:
 * 1. Play "Cha-Ching" sound
 * 2. Vibrate mobile device
 * 3. Show System / PWA Notification
 */
export const notifyNewOrder = async (order = {}) => {
    // 1. Play audio chime
    playChaChingSound();

    // 2. Vibrate phone
    vibratePhone();

    // 3. System Push / PWA Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const orderId = order.id ? `#${order.id.slice(0, 8)}` : 'New Order';
        const amount = order.total_amount ? `৳${Number(order.total_amount).toLocaleString()}` : '';
        const customerName = order.customer_name || 
            (order.shipping_address ? `${order.shipping_address.first_name || ''} ${order.shipping_address.last_name || ''}`.trim() : '') ||
            'A customer';

        const title = `💰 New Order Received! ${amount ? `(${amount})` : ''}`;
        const body = `${customerName} just placed order ${orderId}.\nTap to view full details.`;

        // Check if ServiceWorker registration is available for rich notification with vibration
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            try {
                const reg = await navigator.serviceWorker.ready;
                if (reg && reg.showNotification) {
                    await reg.showNotification(title, {
                        body: body,
                        icon: '/pwa-192x192.png',
                        badge: '/favicon.svg',
                        vibrate: [200, 100, 200, 100, 400],
                        tag: `order-${order.id || Date.now()}`,
                        renotify: true,
                        data: {
                            url: '/admin/orders',
                            orderId: order.id
                        }
                    });
                    return;
                }
            } catch (swErr) {
                console.warn('SW notification fallback to regular Notification:', swErr);
            }
        }

        // Fallback: regular Window Notification
        try {
            const notif = new Notification(title, {
                body: body,
                icon: '/pwa-192x192.png',
                badge: '/favicon.svg',
                tag: `order-${order.id || Date.now()}`
            });
            notif.onclick = () => {
                window.focus();
                if (window.location.pathname !== '/admin/orders') {
                    window.location.href = '/admin/orders';
                }
            };
        } catch (e) {
            console.warn('Could not display window notification:', e);
        }
    }
};

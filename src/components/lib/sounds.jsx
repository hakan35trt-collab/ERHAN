const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3';

export const playNotificationSound = () => {
    try {
        const audio = new Audio(NOTIFICATION_SOUND_URL);
        audio.play().catch(error => {
            console.warn("Bildirim sesi tarayıcı tarafından engellendi:", error);
        });
    } catch (error) {
        console.error("Bildirim sesi oynatılamadı:", error);
    }
};
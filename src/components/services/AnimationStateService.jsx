class AnimationStateService {
    constructor() {
        this.scrollingAnnouncementStartTime = null;
        this.isFirstRun = true;
    }
    getAnimationConfig() {
        if (!this.scrollingAnnouncementStartTime) {
            // Set start time relative to a fixed point in the past to allow for initial delay
            this.scrollingAnnouncementStartTime = Date.now() - 2000;
        }
        
        const isFirst = this.isFirstRun;
        if (this.isFirstRun) {
            this.isFirstRun = false; 
        }

        return {
            startTime: this.scrollingAnnouncementStartTime,
            isFirstRun: isFirst
        };
    }
}
export const animationStateService = new AnimationStateService();
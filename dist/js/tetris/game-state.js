// ==========================================
// 📊 GAME STATE - Patrón: State & Observer
// ==========================================
(function() {
    class GameState {
        constructor(config) {
            this.config = config;
            this.listeners = [];
            this.reset();
        }

        reset() {
            this.score = 0;
            this.lines = 0;
            this.level = 1;
            this.dropInterval = this.config.INITIAL_DROP_INTERVAL;
            this.isPaused = false;
            this.isGameOver = false;
            this.gameStarted = false;
            this.startTime = 0;
            this.elapsedTime = 0;
            this.notify();
        }

        subscribe(callback) {
            this.listeners.push(callback);
        }

        notify() {
            this.listeners.forEach(fn => fn(this));
        }

        addScore(clearedCount) {
            if (clearedCount <= 0) return;
            const pts = (this.config.SCORE_POINTS[clearedCount] || (clearedCount * 200)) * this.level;
            this.score += pts;
            this.lines += clearedCount;

            const nextLvl = Math.floor(this.lines / 10) + 1;
            if (nextLvl > this.level) {
                this.level = nextLvl;
                this.dropInterval = Math.max(
                    this.config.MIN_DROP_INTERVAL,
                    this.config.INITIAL_DROP_INTERVAL - (this.level * this.config.LEVEL_SPEED_STEP)
                );
            }
            this.notify();
        }

        getFormattedTime() {
            const total = this.gameStarted && !this.isPaused && !this.isGameOver
                ? Date.now() - this.startTime + this.elapsedTime
                : this.elapsedTime;
            const sec = Math.floor((total / 1000) % 60);
            const min = Math.floor((total / (1000 * 60)) % 60);
            return `${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}`;
        }
    }

    window.GameState = GameState;
})();

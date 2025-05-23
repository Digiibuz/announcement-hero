
export class SaveThrottler {
  private throttleTimer: number | null = null;
  private saveInProgress: boolean = false;

  canSave() {
    return !this.throttleTimer && !this.saveInProgress;
  }

  startSave() {
    this.saveInProgress = true;
    this.throttleTimer = window.setTimeout(() => {
      this.throttleTimer = null;
    }, 500);
  }

  endSave() {
    this.saveInProgress = false;
  }

  cleanup() {
    if (this.throttleTimer !== null) {
      clearTimeout(this.throttleTimer);
    }
  }
}

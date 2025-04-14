
interface VisibilityState {
  isPending: boolean;
  lastChangeTime: number;
  changeCount: number;
  timerId: number | null;
}

export class VisibilityHandler {
  private state: VisibilityState = {
    isPending: false,
    lastChangeTime: 0,
    changeCount: 0,
    timerId: null,
  };

  private formRoutes = ['/create', '/edit'];

  handleVisibilityChange(
    onHidden: () => void,
    onVisible: () => void,
    debug: boolean = false
  ) {
    const currentPath = window.location.pathname;
    const isFormRoute = this.formRoutes.some(route => currentPath.startsWith(route));

    this.state.changeCount += 1;
    
    if (this.state.changeCount > 5) {
      console.error("Too many visibility changes detected, ignoring this event");
      setTimeout(() => {
        this.state.changeCount = 0;
      }, 2000);
      return;
    }
    
    const now = Date.now();
    if (now - this.state.lastChangeTime < 300) {
      if (debug) console.log('Visibility change ignored (too close)');
      return;
    }
    
    this.state.lastChangeTime = now;
    
    if (this.state.timerId !== null) {
      clearTimeout(this.state.timerId);
      this.state.timerId = null;
    }
    
    if (document.visibilityState === 'hidden') {
      if (debug) console.log('Tab hidden, saving data');
      if (!isFormRoute) {
        onHidden();
      }
      this.state.isPending = false;
    } else if (document.visibilityState === 'visible' && !this.state.isPending) {
      if (debug) console.log('Tab visible, processing visibility change');
      this.state.isPending = true;
      
      this.state.timerId = window.setTimeout(() => {
        if (!isFormRoute) {
          onVisible();
        }
        if (debug) console.log('Visibility change processing complete');
        this.state.isPending = false;
        this.state.timerId = null;
        
        setTimeout(() => {
          this.state.changeCount = 0;
        }, 500);
      }, 1000);
    }
  }

  cleanup() {
    if (this.state.timerId !== null) {
      clearTimeout(this.state.timerId);
    }
  }

  isPending() {
    return this.state.isPending;
  }
}

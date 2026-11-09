const DEFAULTS = { threshold: 72, velocity: 0.42, maxVerticalRatio: 0.7 };

export class GestureController {
  constructor(root, callbacks, getPreferences) {
    this.root = root; this.callbacks = callbacks; this.getPreferences = getPreferences;
    this.pointer = null; this.lastTap = 0; this.enabled = true;
    this.onDown = this.onDown.bind(this); this.onMove = this.onMove.bind(this); this.onUp = this.onUp.bind(this); this.onCancel = this.onCancel.bind(this);
    root.addEventListener('pointerdown', this.onDown, {passive:true});
    root.addEventListener('pointermove', this.onMove, {passive:true});
    root.addEventListener('pointerup', this.onUp, {passive:true});
    root.addEventListener('pointercancel', this.onCancel, {passive:true});
  }
  onDown(event) {
    const target = event.target;
    if (!target.closest || target.closest('button,input,textarea,select,a,[data-no-gesture],video')) return;
    this.pointer = {id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now(),target};
  }
  onMove(event) {
    const start=this.pointer;
    if(!start||start.id!==event.pointerId)return;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;
    if(Math.abs(dx)>18&&Math.abs(dx)>Math.abs(dy)*1.15){
      this.root.classList.toggle('is-swiping-left',dx<0);
      this.root.classList.toggle('is-swiping-right',dx>0);
    } else this.clearSwipeFeedback();
  }
  clearSwipeFeedback() { this.root.classList.remove('is-swiping-left','is-swiping-right'); }
  onUp(event) {
    const start = this.pointer; this.pointer = null;
    this.clearSwipeFeedback();
    if (!start || start.id !== event.pointerId) return;
    const prefs = this.getPreferences();
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    const dt = Math.max(1, performance.now() - start.time);
    const absX = Math.abs(dx), absY = Math.abs(dy);
    const factor = prefs.sensitivity === 'low' ? 1.25 : prefs.sensitivity === 'high' ? 0.78 : 1;
    const threshold = DEFAULTS.threshold * factor;
    const speed = Math.max(absX, absY) / dt;
    if (absX < threshold && absY < threshold) {
      if (prefs.doubleTap && event.target.closest?.('[data-illustration]')) {
        const now = Date.now();
        if (now - this.lastTap < 320) this.callbacks.zoom?.(event.target.closest('[data-illustration]'));
        this.lastTap = now;
      }
      return;
    }
    if (speed < DEFAULTS.velocity * factor) return;
    const inWorkout = document.body.dataset.view === 'session';
    if (inWorkout && prefs.workoutGestures) {
      if (absX > absY * 1.18) this.callbacks.workout?.(dx < 0 ? 'next' : 'previous');
      else if (dy < -threshold) this.callbacks.instructions?.('open');
      else if (dy > threshold) this.callbacks.instructions?.('close');
      return;
    }
    if (prefs.gestures && absX > absY * DEFAULTS.maxVerticalRatio) this.callbacks.navigate?.(dx < 0 ? 1 : -1);
  }
  onCancel() { this.pointer = null; this.clearSwipeFeedback(); }
  destroy() {
    this.root.removeEventListener('pointerdown', this.onDown);
    this.root.removeEventListener('pointermove', this.onMove);
    this.root.removeEventListener('pointerup', this.onUp);
    this.root.removeEventListener('pointercancel', this.onCancel);
  }
}

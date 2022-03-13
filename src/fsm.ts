interface IStates {
  [key: string]: {
    on: {
      [key: string]: string;
    };
  };
}

interface IFiniteStateMachineOptions {
  initial: string;
  states: IStates;
}

class FSM {
  currentState: string;
  states: IStates;
  lastState: string | undefined;
  constructor(options: IFiniteStateMachineOptions) {
    this.currentState = options.initial;
    this.states = options.states;
  }

  nameUp(name: string): string {
    return name.replace(/_([a-zA-Z])/g, (_, p1) => p1.toUpperCase());
  }

  fire(event: string, ...args: unknown[]): Promise<void> {
    const current_state = this.currentState;
    const toState = ((this.states[current_state] || {}).on || {})[event];
    if (toState === undefined) {
      throw new Error(`Bad event [${event}] on state [${current_state}]`);
    }

    if (!this.states[toState]) {
      throw new Error(`Can't transfer to state [${toState}]`);
    }

    const onFunc = (name: string, ...args2: unknown[]) => {
      // @ts-ignore
      const fn = this[(this.nameUp(name))];
      if (typeof fn === 'function') {
        return fn.call(this, ...args2);
      }
    };

    // transfer to `to_state`
    return Promise.resolve()
      .then(() => onFunc(`on_leave_${current_state}`))
      .then(() => onFunc(`on_enter_${toState}`))
      .then(() => {
        this.lastState = this.currentState;
        this.currentState = toState;
      })
      .then(() => onFunc(`on_${toState}`, ...args));
  }

  canFire(event: string): boolean {
    return Boolean(((this.states[this.currentState] || {}).on || {})[event]);
  }

  getState(): string | undefined {
    return this.currentState;
  }

  getLastState(): string | undefined {
    return this.lastState;
  }
}

export default FSM;

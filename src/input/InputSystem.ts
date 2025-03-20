/**
 * Input System for GameForge
 * 
 * Provides a unified interface for keyboard, mouse, and gamepad input,
 * with support for customizable key bindings and input mapping.
 */

export enum InputType {
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  GAMEPAD = 'gamepad'
}

export enum ButtonState {
  PRESSED = 'pressed',   // Button is currently down
  RELEASED = 'released', // Button is currently up
  JUST_PRESSED = 'just_pressed',   // Button was just pressed this frame
  JUST_RELEASED = 'just_released'  // Button was just released this frame
}

export enum MouseButton {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
  BACK = 3,
  FORWARD = 4
}

export enum GamepadButton {
  A = 0,
  B = 1,
  X = 2,
  Y = 3,
  LEFT_BUMPER = 4,
  RIGHT_BUMPER = 5,
  LEFT_TRIGGER = 6,
  RIGHT_TRIGGER = 7,
  SELECT = 8,
  START = 9,
  LEFT_STICK = 10,
  RIGHT_STICK = 11,
  DPAD_UP = 12,
  DPAD_DOWN = 13,
  DPAD_LEFT = 14,
  DPAD_RIGHT = 15
}

export enum GamepadAxis {
  LEFT_STICK_X = 0,
  LEFT_STICK_Y = 1,
  RIGHT_STICK_X = 2,
  RIGHT_STICK_Y = 3
}

export interface InputBinding {
  name: string;
  keys: Array<{
    type: InputType;
    code: string | number;
    modifier?: string | number;
  }>;
}

export interface InputAction {
  name: string;
  bindings: string[];
  isActive: boolean;
  value: number;
}

export interface InputAxis {
  name: string;
  positiveBindings: string[];
  negativeBindings: string[];
  value: number;
  deadzone: number;
  sensitivity: number;
  gravity: number;
  snap: boolean;
}

export interface InputConfig {
  bindings: InputBinding[];
  actions: InputAction[];
  axes: InputAxis[];
}

export class InputSystem {
  private static instance: InputSystem;
  private isInitialized: boolean = false;
  
  private keyStates: Map<string, ButtonState> = new Map();
  private prevKeyStates: Map<string, ButtonState> = new Map();
  
  private mousePosition: [number, number] = [0, 0];
  private prevMousePosition: [number, number] = [0, 0];
  private mouseDelta: [number, number] = [0, 0];
  private mouseButtonStates: Map<number, ButtonState> = new Map();
  private prevMouseButtonStates: Map<number, ButtonState> = new Map();
  private wheelDelta: number = 0;
  
  private gamepads: Map<number, Gamepad> = new Map();
  private gamepadButtonStates: Map<string, ButtonState> = new Map();
  private prevGamepadButtonStates: Map<string, ButtonState> = new Map();
  private gamepadAxisValues: Map<string, number> = new Map();
  
  private bindings: Map<string, InputBinding> = new Map();
  private actions: Map<string, InputAction> = new Map();
  private axes: Map<string, InputAxis> = new Map();
  
  private actionListeners: Map<string, Array<(value: number) => void>> = new Map();
  private axisListeners: Map<string, Array<(value: number) => void>> = new Map();
  
  private anyKeyPressedThisFrame: boolean = false;
  
  private constructor() {}
  
  public static getInstance(): InputSystem {
    if (!InputSystem.instance) {
      InputSystem.instance = new InputSystem();
    }
    return InputSystem.instance;
  }
  
  public initialize(config?: InputConfig): void {
    if (this.isInitialized) return;
    
    console.log('Initializing input system...');
    
    // Set up default or custom configuration
    if (config) {
      this.setupConfiguration(config);
    } else {
      this.setupDefaultConfiguration();
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    this.isInitialized = true;
    console.log('Input system initialized successfully');
  }
  
  private setupConfiguration(config: InputConfig): void {
    // Clear existing configuration
    this.bindings.clear();
    this.actions.clear();
    this.axes.clear();
    
    // Set up bindings
    config.bindings.forEach(binding => {
      this.bindings.set(binding.name, binding);
    });
    
    // Set up actions
    config.actions.forEach(action => {
      this.actions.set(action.name, {...action, isActive: false, value: 0});
    });
    
    // Set up axes
    config.axes.forEach(axis => {
      this.axes.set(axis.name, {...axis, value: 0});
    });
  }
  
  private setupDefaultConfiguration(): void {
    // Standard WASD movement
    this.addBinding('moveForward', [{type: InputType.KEYBOARD, code: 'KeyW'}]);
    this.addBinding('moveBackward', [{type: InputType.KEYBOARD, code: 'KeyS'}]);
    this.addBinding('moveLeft', [{type: InputType.KEYBOARD, code: 'KeyA'}]);
    this.addBinding('moveRight', [{type: InputType.KEYBOARD, code: 'KeyD'}]);
    this.addBinding('jump', [{type: InputType.KEYBOARD, code: 'Space'}]);
    this.addBinding('sprint', [{type: InputType.KEYBOARD, code: 'ShiftLeft'}]);
    this.addBinding('crouch', [{type: InputType.KEYBOARD, code: 'ControlLeft'}]);
    
    // Mouse
    this.addBinding('primaryAction', [{type: InputType.MOUSE, code: MouseButton.LEFT}]);
    this.addBinding('secondaryAction', [{type: InputType.MOUSE, code: MouseButton.RIGHT}]);
    
    // Gamepad
    this.addBinding('gpMoveHorizontal', [{type: InputType.GAMEPAD, code: GamepadAxis.LEFT_STICK_X}]);
    this.addBinding('gpMoveVertical', [{type: InputType.GAMEPAD, code: GamepadAxis.LEFT_STICK_Y}]);
    this.addBinding('gpLookHorizontal', [{type: InputType.GAMEPAD, code: GamepadAxis.RIGHT_STICK_X}]);
    this.addBinding('gpLookVertical', [{type: InputType.GAMEPAD, code: GamepadAxis.RIGHT_STICK_Y}]);
    this.addBinding('gpJump', [{type: InputType.GAMEPAD, code: GamepadButton.A}]);
    this.addBinding('gpSprint', [{type: InputType.GAMEPAD, code: GamepadButton.RIGHT_TRIGGER}]);
    this.addBinding('gpCrouch', [{type: InputType.GAMEPAD, code: GamepadButton.B}]);
    this.addBinding('gpPrimaryAction', [{type: InputType.GAMEPAD, code: GamepadButton.RIGHT_BUMPER}]);
    this.addBinding('gpSecondaryAction', [{type: InputType.GAMEPAD, code: GamepadButton.LEFT_BUMPER}]);
    
    // Set up actions
    this.addAction('jump', ['jump', 'gpJump']);
    this.addAction('fire', ['primaryAction', 'gpPrimaryAction']);
    this.addAction('aim', ['secondaryAction', 'gpSecondaryAction']);
    this.addAction('sprint', ['sprint', 'gpSprint']);
    this.addAction('crouch', ['crouch', 'gpCrouch']);
    
    // Set up axes
    this.addAxis('horizontal', ['moveRight', 'gpMoveHorizontal'], ['moveLeft'], 0.1);
    this.addAxis('vertical', ['moveForward', 'gpMoveVertical'], ['moveBackward'], 0.1);
    this.addAxis('lookHorizontal', ['gpLookHorizontal'], [], 0.1);
    this.addAxis('lookVertical', ['gpLookVertical'], [], 0.1);
  }
  
  private setupEventListeners(): void {
    // This would be implemented with actual DOM event listeners in a web environment
    // For now, we'll just define the handlers that would be used
    
    // Keyboard events
    const handleKeyDown = (event: any /* KeyboardEvent */): void => {
      const code = event.code;
      
      if (this.keyStates.get(code) !== ButtonState.PRESSED) {
        this.keyStates.set(code, ButtonState.JUST_PRESSED);
        this.anyKeyPressedThisFrame = true;
      }
    };
    
    const handleKeyUp = (event: any /* KeyboardEvent */): void => {
      const code = event.code;
      this.keyStates.set(code, ButtonState.JUST_RELEASED);
    };
    
    // Mouse events
    const handleMouseMove = (event: any /* MouseEvent */): void => {
      this.mousePosition = [event.clientX, event.clientY];
      this.mouseDelta = [
        this.mousePosition[0] - this.prevMousePosition[0],
        this.mousePosition[1] - this.prevMousePosition[1]
      ];
    };
    
    const handleMouseDown = (event: any /* MouseEvent */): void => {
      const button = event.button;
      
      if (this.mouseButtonStates.get(button) !== ButtonState.PRESSED) {
        this.mouseButtonStates.set(button, ButtonState.JUST_PRESSED);
        this.anyKeyPressedThisFrame = true;
      }
    };
    
    const handleMouseUp = (event: any /* MouseEvent */): void => {
      const button = event.button;
      this.mouseButtonStates.set(button, ButtonState.JUST_RELEASED);
    };
    
    const handleWheel = (event: any /* WheelEvent */): void => {
      this.wheelDelta = event.deltaY;
    };
    
    // Gamepad events (handled in update since there's no event API)
    
    // In a real implementation, we would add these event listeners to the window or canvas
    /*
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel);
    
    window.addEventListener('gamepadconnected', (e) => {
      console.log(`Gamepad connected: ${e.gamepad.id}`);
      this.gamepads.set(e.gamepad.index, e.gamepad);
    });
    
    window.addEventListener('gamepaddisconnected', (e) => {
      console.log(`Gamepad disconnected: ${e.gamepad.id}`);
      this.gamepads.delete(e.gamepad.index);
    });
    */
  }
  
  public update(): void {
    if (!this.isInitialized) return;
    
    // Copy current states to previous states
    this.prevKeyStates = new Map(this.keyStates);
    this.prevMouseButtonStates = new Map(this.mouseButtonStates);
    this.prevGamepadButtonStates = new Map(this.gamepadButtonStates);
    this.prevMousePosition = [...this.mousePosition];
    
    // Reset per-frame state
    this.wheelDelta = 0;
    this.anyKeyPressedThisFrame = false;
    
    // Update gamepad state
    this.updateGamepads();
    
    // Update state for JUST_PRESSED and JUST_RELEASED
    this.updateButtonStates();
    
    // Update actions and axes based on input state
    this.updateActions();
    this.updateAxes();
  }
  
  private updateButtonStates(): void {
    // Update keyboard states
    this.keyStates.forEach((state, key) => {
      if (state === ButtonState.JUST_PRESSED) {
        this.keyStates.set(key, ButtonState.PRESSED);
      } else if (state === ButtonState.JUST_RELEASED) {
        this.keyStates.set(key, ButtonState.RELEASED);
      }
    });
    
    // Update mouse button states
    this.mouseButtonStates.forEach((state, button) => {
      if (state === ButtonState.JUST_PRESSED) {
        this.mouseButtonStates.set(button, ButtonState.PRESSED);
      } else if (state === ButtonState.JUST_RELEASED) {
        this.mouseButtonStates.set(button, ButtonState.RELEASED);
      }
    });
    
    // Update gamepad button states
    this.gamepadButtonStates.forEach((state, buttonId) => {
      if (state === ButtonState.JUST_PRESSED) {
        this.gamepadButtonStates.set(buttonId, ButtonState.PRESSED);
      } else if (state === ButtonState.JUST_RELEASED) {
        this.gamepadButtonStates.set(buttonId, ButtonState.RELEASED);
      }
    });
  }
  
  private updateGamepads(): void {
    // In a browser environment, we would use:
    // const gamepads = navigator.getGamepads?.() || [];
    
    // For now, just work with what we have
    this.gamepads.forEach((gamepad, index) => {
      // Update button states
      if (gamepad.buttons) {
        gamepad.buttons.forEach((button, buttonIndex) => {
          const buttonId = `${index}_${buttonIndex}`;
          const pressed = button.pressed;
          
          const prevState = this.gamepadButtonStates.get(buttonId);
          
          if (pressed && prevState !== ButtonState.PRESSED && prevState !== ButtonState.JUST_PRESSED) {
            this.gamepadButtonStates.set(buttonId, ButtonState.JUST_PRESSED);
            this.anyKeyPressedThisFrame = true;
          } else if (!pressed && (prevState === ButtonState.PRESSED || prevState === ButtonState.JUST_PRESSED)) {
            this.gamepadButtonStates.set(buttonId, ButtonState.JUST_RELEASED);
          } else if (pressed) {
            this.gamepadButtonStates.set(buttonId, ButtonState.PRESSED);
          } else {
            this.gamepadButtonStates.set(buttonId, ButtonState.RELEASED);
          }
          
          // Also store analog values for trigger buttons
          const value = button.value;
          this.gamepadAxisValues.set(`${index}_button_${buttonIndex}`, value);
        });
      }
      
      // Update axis values
      if (gamepad.axes) {
        gamepad.axes.forEach((value, axisIndex) => {
          this.gamepadAxisValues.set(`${index}_${axisIndex}`, value);
        });
      }
    });
  }
  
  private updateActions(): void {
    this.actions.forEach((action, actionName) => {
      let isActive = false;
      let value = 0;
      
      // Check each binding for this action
      for (const bindingName of action.bindings) {
        const binding = this.bindings.get(bindingName);
        
        if (!binding) continue;
        
        // Check each key in the binding
        for (const key of binding.keys) {
          let keyState: ButtonState | undefined;
          
          // Get the state based on the input type
          if (key.type === InputType.KEYBOARD) {
            keyState = this.keyStates.get(key.code as string);
          } else if (key.type === InputType.MOUSE) {
            keyState = this.mouseButtonStates.get(key.code as number);
          } else if (key.type === InputType.GAMEPAD) {
            if (typeof key.code === 'number' && key.code < 100) {
              // Gamepad button
              for (const gamepadIndex of this.gamepads.keys()) {
                const buttonId = `${gamepadIndex}_${key.code}`;
                const state = this.gamepadButtonStates.get(buttonId);
                
                if (
                  state === ButtonState.PRESSED || 
                  state === ButtonState.JUST_PRESSED
                ) {
                  keyState = state;
                  
                  // Get analog value for triggers
                  const analogValue = this.gamepadAxisValues.get(`${gamepadIndex}_button_${key.code}`);
                  if (analogValue !== undefined) {
                    value = Math.max(value, analogValue);
                  } else {
                    value = 1.0; // Digital button
                  }
                  
                  break;
                }
              }
            } else {
              // Gamepad axis - treated as a button when value crosses threshold (0.5)
              for (const gamepadIndex of this.gamepads.keys()) {
                const axisValue = this.gamepadAxisValues.get(`${gamepadIndex}_${key.code}`);
                
                if (axisValue !== undefined && Math.abs(axisValue) >= 0.5) {
                  keyState = ButtonState.PRESSED;
                  value = Math.abs(axisValue);
                  break;
                }
              }
            }
          }
          
          if (
            keyState === ButtonState.PRESSED || 
            keyState === ButtonState.JUST_PRESSED
          ) {
            isActive = true;
            
            // For keyboard and mouse, default to 1.0 if no analog value
            if (key.type !== InputType.GAMEPAD || value === 0) {
              value = 1.0;
            }
            
            // No need to check other keys if one is active
            break;
          }
        }
        
        // No need to check other bindings if one is active
        if (isActive) break;
      }
      
      // Update action state
      const prevIsActive = action.isActive;
      action.isActive = isActive;
      action.value = value;
      
      // Notify listeners if state changed
      if (isActive !== prevIsActive || (isActive && value > 0)) {
        const listeners = this.actionListeners.get(actionName);
        if (listeners) {
          for (const listener of listeners) {
            listener(value);
          }
        }
      }
    });
  }
  
  private updateAxes(): void {
    this.axes.forEach((axis, axisName) => {
      let targetValue = 0;
      
      // Check positive bindings
      for (const bindingName of axis.positiveBindings) {
        const binding = this.bindings.get(bindingName);
        
        if (!binding) continue;
        
        for (const key of binding.keys) {
          if (key.type === InputType.GAMEPAD && typeof key.code === 'number' && key.code >= 100) {
            // Gamepad axis
            for (const gamepadIndex of this.gamepads.keys()) {
              const axisValue = this.gamepadAxisValues.get(`${gamepadIndex}_${key.code - 100}`);
              
              if (axisValue !== undefined) {
                // For vertical axes, invert the value (up is positive)
                const adjustedValue = axisName.includes('Vertical') ? -axisValue : axisValue;
                
                if (adjustedValue > 0) {
                  targetValue = Math.max(targetValue, adjustedValue);
                }
              }
            }
          } else {
            // Keyboard, mouse, or gamepad button
            let isActive = false;
            
            if (key.type === InputType.KEYBOARD) {
              const state = this.keyStates.get(key.code as string);
              isActive = state === ButtonState.PRESSED || state === ButtonState.JUST_PRESSED;
            } else if (key.type === InputType.MOUSE) {
              const state = this.mouseButtonStates.get(key.code as number);
              isActive = state === ButtonState.PRESSED || state === ButtonState.JUST_PRESSED;
            } else if (key.type === InputType.GAMEPAD) {
              for (const gamepadIndex of this.gamepads.keys()) {
                const buttonId = `${gamepadIndex}_${key.code}`;
                const state = this.gamepadButtonStates.get(buttonId);
                
                if (state === ButtonState.PRESSED || state === ButtonState.JUST_PRESSED) {
                  isActive = true;
                  break;
                }
              }
            }
            
            if (isActive) {
              targetValue = 1.0;
              break;
            }
          }
        }
        
        if (targetValue > 0) break;
      }
      
      // Check negative bindings if target is still 0
      if (targetValue === 0) {
        for (const bindingName of axis.negativeBindings) {
          const binding = this.bindings.get(bindingName);
          
          if (!binding) continue;
          
          for (const key of binding.keys) {
            if (key.type === InputType.GAMEPAD && typeof key.code === 'number' && key.code >= 100) {
              // Gamepad axis
              for (const gamepadIndex of this.gamepads.keys()) {
                const axisValue = this.gamepadAxisValues.get(`${gamepadIndex}_${key.code - 100}`);
                
                if (axisValue !== undefined) {
                  // For vertical axes, invert the value (down is negative)
                  const adjustedValue = axisName.includes('Vertical') ? -axisValue : axisValue;
                  
                  if (adjustedValue < 0) {
                    targetValue = Math.min(targetValue, adjustedValue);
                  }
                }
              }
            } else {
              // Keyboard, mouse, or gamepad button
              let isActive = false;
              
              if (key.type === InputType.KEYBOARD) {
                const state = this.keyStates.get(key.code as string);
                isActive = state === ButtonState.PRESSED || state === ButtonState.JUST_PRESSED;
              } else if (key.type === InputType.MOUSE) {
                const state = this.mouseButtonStates.get(key.code as number);
                isActive = state === ButtonState.PRESSED || state === ButtonState.JUST_PRESSED;
              } else if (key.type === InputType.GAMEPAD) {
                for (const gamepadIndex of this.gamepads.keys()) {
                  const buttonId = `${gamepadIndex}_${key.code}`;
                  const state = this.gamepadButtonStates.get(buttonId);
                  
                  if (state === ButtonState.PRESSED || state === ButtonState.JUST_PRESSED) {
                    isActive = true;
                    break;
                  }
                }
              }
              
              if (isActive) {
                targetValue = -1.0;
                break;
              }
            }
          }
          
          if (targetValue < 0) break;
        }
      }
      
      // Check for values in the deadzone
      if (Math.abs(targetValue) < axis.deadzone) {
        targetValue = 0;
      }
      
      // Snap to 0 if target is 0 and snap is enabled
      if (targetValue === 0 && axis.snap) {
        axis.value = 0;
      } else {
        // Apply gravity to move toward 0
        if (targetValue === 0) {
          if (axis.value > 0) {
            axis.value = Math.max(0, axis.value - axis.gravity);
          } else if (axis.value < 0) {
            axis.value = Math.min(0, axis.value + axis.gravity);
          }
        } 
        // Apply sensitivity to move toward target
        else {
          if (targetValue > axis.value) {
            axis.value = Math.min(targetValue, axis.value + axis.sensitivity);
          } else if (targetValue < axis.value) {
            axis.value = Math.max(targetValue, axis.value - axis.sensitivity);
          }
        }
      }
      
      // Notify listeners
      const listeners = this.axisListeners.get(axisName);
      if (listeners) {
        for (const listener of listeners) {
          listener(axis.value);
        }
      }
    });
  }
  
  public addBinding(name: string, keys: Array<{type: InputType, code: string | number, modifier?: string | number}>): void {
    this.bindings.set(name, { name, keys });
  }
  
  public removeBinding(name: string): void {
    this.bindings.delete(name);
  }
  
  public addAction(name: string, bindings: string[], negativeBindings: string[] = []): void {
    this.actions.set(name, { name, bindings, isActive: false, value: 0 });
  }
  
  public removeAction(name: string): void {
    this.actions.delete(name);
    this.actionListeners.delete(name);
  }
  
  public addAxis(name: string, positiveBindings: string[], negativeBindings: string[], deadzone: number = 0.1): void {
    this.axes.set(name, {
      name,
      positiveBindings,
      negativeBindings,
      value: 0,
      deadzone,
      sensitivity: 3.0,
      gravity: 3.0,
      snap: true
    });
  }
  
  public removeAxis(name: string): void {
    this.axes.delete(name);
    this.axisListeners.delete(name);
  }
  
  public isActionActive(name: string): boolean {
    return this.actions.get(name)?.isActive || false;
  }
  
  public getActionValue(name: string): number {
    return this.actions.get(name)?.value || 0;
  }
  
  public getAxisValue(name: string): number {
    return this.axes.get(name)?.value || 0;
  }
  
  public getMousePosition(): [number, number] {
    return [...this.mousePosition];
  }
  
  public getMouseDelta(): [number, number] {
    return [...this.mouseDelta];
  }
  
  public getWheelDelta(): number {
    return this.wheelDelta;
  }
  
  public addActionListener(actionName: string, callback: (value: number) => void): void {
    if (!this.actionListeners.has(actionName)) {
      this.actionListeners.set(actionName, []);
    }
    
    this.actionListeners.get(actionName)!.push(callback);
  }
  
  public removeActionListener(actionName: string, callback: (value: number) => void): void {
    const listeners = this.actionListeners.get(actionName);
    
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  public addAxisListener(axisName: string, callback: (value: number) => void): void {
    if (!this.axisListeners.has(axisName)) {
      this.axisListeners.set(axisName, []);
    }
    
    this.axisListeners.get(axisName)!.push(callback);
  }
  
  public removeAxisListener(axisName: string, callback: (value: number) => void): void {
    const listeners = this.axisListeners.get(axisName);
    
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  public isKeyPressed(keyCode: string): boolean {
    const state = this.keyStates.get(keyCode);
    return state === ButtonState.PRESSED || state === ButtonState.JUST_PRESSED;
  }
  
  public isKeyJustPressed(keyCode: string): boolean {
    return this.keyStates.get(keyCode) === ButtonState.JUST_PRESSED;
  }
  
  public isKeyJustReleased(keyCode: string): boolean {
    return this.keyStates.get(keyCode) === ButtonState.JUST_RELEASED;
  }
  
  public isMouseButtonPressed(button: MouseButton): boolean {
    const state = this.mouseButtonStates.get(button);
    return state === ButtonState.PRESSED || state === ButtonState.JUST_PRESSED;
  }
  
  public isMouseButtonJustPressed(button: MouseButton): boolean {
    return this.mouseButtonStates.get(button) === ButtonState.JUST_PRESSED;
  }
  
  public isMouseButtonJustReleased(button: MouseButton): boolean {
    return this.mouseButtonStates.get(button) === ButtonState.JUST_RELEASED;
  }
  
  public isGamepadButtonPressed(gamepadIndex: number, button: GamepadButton): boolean {
    const state = this.gamepadButtonStates.get(`${gamepadIndex}_${button}`);
    return state === ButtonState.PRESSED || state === ButtonState.JUST_PRESSED;
  }
  
  public isGamepadButtonJustPressed(gamepadIndex: number, button: GamepadButton): boolean {
    return this.gamepadButtonStates.get(`${gamepadIndex}_${button}`) === ButtonState.JUST_PRESSED;
  }
  
  public isGamepadButtonJustReleased(gamepadIndex: number, button: GamepadButton): boolean {
    return this.gamepadButtonStates.get(`${gamepadIndex}_${button}`) === ButtonState.JUST_RELEASED;
  }
  
  public getGamepadAxisValue(gamepadIndex: number, axis: GamepadAxis): number {
    return this.gamepadAxisValues.get(`${gamepadIndex}_${axis}`) || 0;
  }
  
  public isAnyKeyPressed(): boolean {
    return this.anyKeyPressedThisFrame;
  }
  
  public isAnyGamepadConnected(): boolean {
    return this.gamepads.size > 0;
  }
  
  public getGamepadCount(): number {
    return this.gamepads.size;
  }
  
  public loadInputConfiguration(config: InputConfig): void {
    this.setupConfiguration(config);
  }
  
  public getInputConfiguration(): InputConfig {
    return {
      bindings: Array.from(this.bindings.values()),
      actions: Array.from(this.actions.values()),
      axes: Array.from(this.axes.values())
    };
  }
}

export default InputSystem; 
//% weight=0 color=#920dc6 icon="\uf11b" block="GamePad"
namespace KSB045 {
    export enum valueType {
        //% block="X"
        X,
        //% block="Y"
        Y
    }
    let XPin = AnalogPin.P2;
    let YPin = AnalogPin.P1;
    let SWPin = DigitalPin.P8;
    let CPin = DigitalPin.P15;
    let DPin = DigitalPin.P14;
    let EPin = DigitalPin.P13;
    let FPin = DigitalPin.P12;
    let midX = getJoystickValue(valueType.X);
    let midY = getJoystickValue(valueType.Y);
    let init=false;
    function pin_init():void{
        pins.setPull(CPin, PinPullMode.PullUp);
        pins.setPull(DPin, PinPullMode.PullUp);
        pins.setPull(EPin, PinPullMode.PullUp);
        pins.setPull(FPin, PinPullMode.PullUp);
        pins.setPull(SWPin, PinPullMode.PullUp);
        init=true;
    }
    pin_init();



    export enum pushType {
        //% block="pressed"
        down = PulseValue.High,
        //% block="released"
        up = PulseValue.Low
    }
    export enum btnName {
        //% block="C"
        C = <number>CPin,
        //% block="D"
        D = <number>DPin,
        //% block="E"
        E = <number>EPin,
        //% block="F"
        F = <number>FPin,
        //% block="Stick"
        SW = <number>SWPin
    }
    export enum vibrate {
        //% block="on"
        on = 1,
        //% block="off"
        off = 0
    }

    /**
     * Get the value of X axle and Y axle of the joystick, the value range is from 0 to 1023.
     */
    //% blockId=getJoystickValue block="joystick value of %myType"
    //% weight=70
    export function getJoystickValue(myType: valueType): number {
        switch (myType) {
            case valueType.X: return (1023 - pins.analogReadPin(XPin));
            case valueType.Y: return pins.analogReadPin(YPin);
            default: return 0;
        }
    }

    /**
     * Get the value of X axle and Y axle of the joystick when the joystick in the center position.
     */
    //% blockId=getCenterValue block="joystick center value of %myType"
    //% weight=60
    export function getCenterValue(myType: valueType): number {
        switch (myType) {
            case valueType.X: return midX;
            case valueType.Y: return midY;
            default: return 0;
        }
    }

    /**
     * Get the button state(is pressed or not) for button C,D,E,F and stick, return true or false
     */
    //% blockId=getBtnValue block="button |%myBtn| is pressed?"
    //% weight=55
    export function getBtnValue(myBtn: btnName): boolean {
        return (pins.digitalReadPin(<number>myBtn) == 0 ? true : false)
    }
    /**
     * Do something when a button is pushed down or released. 
     */
    //% blockId=onBtnChanged block="on button |%myBtn|  %dir|" blockInlineInputs=true
    //% weight=50
    export function onBtnChanged(myBtn: btnName, dir: pushType, handler: Action): void {
        if (!init){
            pin_init();
        }
        pins.onPulsed(<number>myBtn, <number>dir, handler);
    }

    /**
     * set the vibration motor is on or off  
     */
    //% blockId=setVibration block="set vibration motor %vType"
    //% weight=45
    export function setVibration(vType: vibrate): void {
        pins.digitalWritePin(DigitalPin.P16, vType);
    }

    /**
     * set the power of vibration motor, from 0 to 1023. 0 to stop the vibration motor, and 1023 to full run the motor.
     */
    //% blockId=setVibrationPWM block="set the power of vibration motor(0~0123): %power"
    //% power.min=0 power.max=1023
    //% weight=40
    export function setVibrationPWM(power: number): void {
        pins.analogWritePin(AnalogPin.P16, power);
    }
} 

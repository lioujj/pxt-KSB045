//% weight=0 color=#920dc6 icon="\uf11b" block="GamePad"
namespace KSB045 {
    export enum valueType {
        //% block="X"
        X,
        //% block="Y"
        Y
    }
    export enum encodingType {
        //% block="NEC"
        NEC,
        //% block="SONY"
        SONY
    }
    const XPin = AnalogPin.P2;
    const YPin = AnalogPin.P1;
    const SWPin = DigitalPin.P8;
    const CPin = DigitalPin.P15;
    const DPin = DigitalPin.P14;
    const EPin = DigitalPin.P13;
    const FPin = DigitalPin.P12;
    const irLed = AnalogPin.P16;
    const pwmPeriod = 26;
    let arr: number[] = [];
    let midX = getJoystickValue(valueType.X);
    let midY = getJoystickValue(valueType.Y);
    let init = false;
    arr = [];
    function pin_init(): void {
        pins.setPull(CPin, PinPullMode.PullUp);
        pins.setPull(DPin, PinPullMode.PullUp);
        pins.setPull(EPin, PinPullMode.PullUp);
        pins.setPull(FPin, PinPullMode.PullUp);
        pins.setPull(SWPin, PinPullMode.PullUp);
        init = true;
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
    //% weight=100
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
    //% weight=90
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
    //% weight=80
    export function getBtnValue(myBtn: btnName): boolean {
        return (pins.digitalReadPin(<number>myBtn) == 0 ? true : false)
    }
    /**
     * Do something when a button is pushed down or released. 
     */
    //% blockId=onBtnChanged block="on button |%myBtn|  %dir|" blockInlineInputs=true
    //% weight=70
    export function onBtnChanged(myBtn: btnName, dir: pushType, handler: Action): void {
        if (!init) {
            pin_init();
        }
        pins.onPulsed(<number>myBtn, <number>dir, handler);
    }

    /**
     * set the vibration motor is on or off  
     */
    //% blockId=setVibration block="set vibration motor %vType"
    //% weight=60
    export function setVibration(vType: vibrate): void {
        pins.digitalWritePin(DigitalPin.P16, vType);
    }

    /**
     * set the power of vibration motor, from 0 to 1023. 0 to stop the vibration motor, and 1023 to full run the motor.
     */
    //% blockId=setVibrationPWM block="set the power of vibration motor(0~0123): %power"
    //% power.min=0 power.max=1023
    //% weight=50
    export function setVibrationPWM(power: number): void {
        pins.analogWritePin(AnalogPin.P16, power);
    }
    //----------------send IR--------------------
    function transmitBit(highTime: number, lowTime: number): void {
        pins.analogWritePin(irLed, 512);
        control.waitMicros(highTime);
        pins.analogWritePin(irLed, 0);
        control.waitMicros(lowTime);
    }

    function setIR_pin() {
        pins.analogWritePin(irLed, 0);
        pins.analogSetPeriod(irLed, pwmPeriod);
    }

    /**
     * send message from IR LED. You must set the message encoding type, send how many times, and the message.
     */
    //% blockId=sendMyMessage1 block="send message: %msg| ,%times| times, encoding type:%myType"
    //% weight=30
    export function sendMyMessage1(msg: string, times: number, myType: encodingType): void {
        setIR_pin();
        sendMessage(convertHexStrToNum(msg), times, myType);
    }

    function encode(myCode: number, bits: number, trueHigh: number, trueLow: number, falseHigh: number, falseLow: number): void {
        const MESSAGE_BITS = bits;
        for (let mask = 1 << (MESSAGE_BITS - 1); mask > 0; mask >>= 1) {
            if (myCode & mask) {
                transmitBit(trueHigh, trueLow);
            } else {
                transmitBit(falseHigh, falseLow);
            }
        }
    }

    function sendNEC(message: number, times: number): void {
        const enum NEC {
            startHigh = 9000,
            startLow = 4500,
            stopHigh = 560,
            stopLow = 0,
            trueHigh = 560,
            trueLow = 1690,
            falseHigh = 560,
            falseLow = 560,
            interval = 110000
        }
        let address = message >> 16;
        let command = message % 0x010000;
        const MESSAGE_BITS = 16;
        let startTime = 0;
        let betweenTime = 0;
        for (let sendCount = 0; sendCount < times; sendCount++) {
            startTime = input.runningTimeMicros();
            transmitBit(NEC.startHigh, NEC.startLow);
            encode(address, 16, NEC.trueHigh, NEC.trueLow, NEC.falseHigh, NEC.falseLow);
            encode(command, 16, NEC.trueHigh, NEC.trueLow, NEC.falseHigh, NEC.falseLow);
            transmitBit(NEC.stopHigh, NEC.stopLow);
            betweenTime = input.runningTimeMicros() - startTime
            if (times > 0)
                control.waitMicros(NEC.interval - betweenTime);
        }
    }

    function sendSONY(message: number, times: number): void {
        const enum SONY {
            startHigh = 2300,
            startLow = 500,
            trueHigh = 1100,
            trueLow = 500,
            falseHigh = 500,
            falseLow = 500,
            interval = 45000
        }
        const MESSAGE_BITS = 12;
        let startTime = 0;
        let betweenTime = 0;
        for (let sendCount = 0; sendCount < times; sendCount++) {
            startTime = input.runningTimeMicros();
            transmitBit(SONY.startHigh, SONY.startLow);
            encode(message, 12, SONY.trueHigh, SONY.trueLow, SONY.falseHigh, SONY.falseLow);
            betweenTime = input.runningTimeMicros() - startTime
            if (times > 0)
                control.waitMicros(SONY.interval - betweenTime);
        }
    }
    export function sendMessage(message: number, times: number, myType: encodingType): void {
        switch (myType) {
            case encodingType.NEC: sendNEC(message, times);
            case encodingType.SONY: sendSONY(message, times);
            default: sendNEC(message, times);
        }
    }

    function convertHexStrToNum(myMsg: string): number {
        let myNum = 0
        for (let i = 0; i < myMsg.length; i++) {
            if ((myMsg.charCodeAt(i) > 47) && (myMsg.charCodeAt(i) < 58)) {
                myNum += (myMsg.charCodeAt(i) - 48) * (16 ** (myMsg.length - 1 - i))
            } else if ((myMsg.charCodeAt(i) > 96) && (myMsg.charCodeAt(i) < 103)) {
                myNum += (myMsg.charCodeAt(i) - 87) * (16 ** (myMsg.length - 1 - i))
            } else if ((myMsg.charCodeAt(i) > 64) && (myMsg.charCodeAt(i) < 71)) {
                myNum += (myMsg.charCodeAt(i) - 55) * (16 ** (myMsg.length - 1 - i))
            } else {
                myNum = 0
                break
            }
        }
        return myNum
    }
}

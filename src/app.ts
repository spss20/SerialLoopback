import { SerialPort } from "serialport";
import { Utils } from "./utils";
import "dotenv/config";
import { clearTimeout } from 'timers';

//List Devices
// SerialPort.list().then((devices)=>console.log(devices));

let text = "{}Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.[]";
text = "{}Hello I am FCC[]";
// text = "{}Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been. the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book[]"

//Connecting Device
const port = new SerialPort({
    baudRate: +process.env.baudrate!,
    path: process.env.path!,
    parity: 'none'
}, (err) => {
    if (err)
        console.log("An error occured while opening serial port \n", err);
    else {
        console.log("Serial port connected successfully");
        startLoopbackTest();
    }
});

let packets: number[] = []
let errors = 0;
let correct = 0;
let timedOutCount = 0;

let lastPacket: Buffer;
let timeout: any;
let currentPort = "2";

async function startLoopbackTest() {

    port.on('data', (data: Buffer) => {
        console.log("RAW:", data);

        if (packets.length == 0) {
            //Form a new packet

            if (data[0] == 0xAA && data[1] == 0x26) {
                //SOF Packet Found
                packets.push(...data);

                //Checking for EOF
                if (data[data.length - 2] == 0xAA && data[data.length - 1] == 0xD9) {
                    //EOF Found
                    parseData(packets)
                    packets = [];
                }
            } else {
                if (data[0] == 0x26 && lastPacket[0] == 0xAA) {
                    console.log("SOF found in last packet");
                    packets.push(...lastPacket);
                    packets.push(...data);

                    //Checking for EOF
                    if (data[data.length - 2] == 0xAA && data[data.length - 1] == 0xD9) {
                        //EOF Found
                        parseData(packets)
                        packets = [];
                    }
                } else {
                    //Discard Packet
                    console.log("Discarding packet", data);
                }
            }

        } else {
            //Append existing packet
            packets.push(...data);

            if (data[data.length - 2] == 0xAA && data[data.length - 1] == 0xD9) {
                //EOF Packet Found
                parseData(packets);
                packets = [];
            } else if (data[data.length - 1] == 0xD9 && lastPacket[lastPacket.length - 1] == 0xAA) {
                parseData(packets);
                packets = [];
            }

        }

        lastPacket = data;
    });

    // sendPacket();
    changeBaudRate();
}

async function sendPacket() {
    const buffer = [];

    buffer.push(currentPort);

    const dataLength = text.length;
    const dl = ('0000' + dataLength).match(/\d{4}$/)?.toString();
    buffer.push(dl);

    buffer.push(text);

    const wholeString = buffer.join("");
    const buf = Buffer.from(wholeString);

    console.log("Sent:", wholeString);
    console.log("Sent:", buf)
    port.write(buf);

    timeout = setTimeout(() => {
        console.log("Timeout Packet");
        errors++;
        timedOutCount++;
        sendPacket();
    }, 3000);
}

async function changeBaudRate() {
    const buffer = [];
    buffer.push(currentPort); //Port number
    buffer.push("0000"); //Data length constant 0000
    buffer.push("009600"); //baud Rate
    buffer.push("9"); //Word Length
    buffer.push("1"); //Stop Bit
    buffer.push("1"); //Parity 0 = none , 1 = odd , 2 = even

    const wholeString = buffer.join("");
    const buf = Buffer.from(wholeString);

    console.log("Sent:", wholeString);
    console.log("Sent:", buf)
    port.write(buf);

    setTimeout(() => {
        sendCommand();
    }, 1000);
    // timeout = setTimeout(()=>{
    //     console.log("Timeout Packet");
    //     errors++;
    //     timedOutCount++;
    //     sendPacket();
    // } , 3000);
}

async function sendCommand() {
    const buffer = [];
    
    const data = [0x51 , 0x20 , 0xFA];

    buffer.push(...Buffer.from(currentPort));

    const dataLength = data.length;
    const dl = ('0000' + dataLength).match(/\d{4}$/)?.toString();

    buffer.push(...Buffer.from(dl!));
    buffer.push(...data);

    console.log("Sent:", Utils.byteToHexString(buffer));
    port.write(buffer);

    timeout = setTimeout(() => {
        console.log("Timeout Packet");
        errors++;
        timedOutCount++;
        sendCommand();
    }, 500);
}

async function parseData(data: number[]) {
    clearTimeout(timeout);

    const buffer = Buffer.from(data.slice(7, data.length - 2));
    console.log("Received:", buffer);

    if (buffer.compare(Buffer.from([0x51 , 0x70 , 0xFA])) == 0) {
        correct++;
    } else errors++;

    console.log({ errors, timedOutCount, correct });

    sendCommand();
}

async function sendPacket2() {
    const buffer: number[] = [];
    buffer.push(0xAA);
    buffer.push(0x26);

    buffer.push(...Buffer.from(text));

    buffer.push(0xAA);
    buffer.push(0xD9);

    write(buffer);

    timeout = setTimeout(() => {
        console.log("Timeout Packet");
        errors++;
        sendPacket();
    }, 200);
}

async function write(data: number[]) {
    console.log("Sent:", Utils.byteToHexString(data));
    port.write(data);
};

async function parseData2(data: number[]) {
    clearTimeout(timeout);

    const buffer = Buffer.from(data.slice(7, data.length - 2));
    console.log("Received:", buffer);
    console.log("Received:", buffer.toString('utf-8'));

    if (buffer.toString('utf-8') == text) {
        correct++;
    } else errors++;

    console.log({ errors, timedOutCount, correct });

    sendPacket();
}


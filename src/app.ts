import { SerialPort} from "serialport";
import { Utils } from "./utils";

//List Devices
// const devices = await SerialPort.list();
// console.log(devices);

let text = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
// text = "HelloWorld";
//Connecting Device
const port = new SerialPort({
    baudRate: 9600,
    path: "/dev/tty.usbserial-DN06BD7Q",
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
let lastPacket: Buffer;

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

    const buffer: number[] = [];
    buffer.push(0xAA);
    buffer.push(0x26);

    buffer.push(...Buffer.from("HelloWorld"));

    buffer.push(0xAA);
    buffer.push(0xD9);

    write(buffer);//
}

async function write(data: number[]) {
    console.log("Sent:", Utils.byteToHexString(data));
    port.write(data);
};

async function parseData(data: number[]) {
    const buffer = Buffer.from(data.slice(2, data.length - 2));
    console.log("Received:", buffer);
    console.log("Received:", buffer.toString('utf-8'));
    if (buffer.toString('utf-8') == text) {
        correct++;
    } else errors++;
    console.log({ errors, correct })
}
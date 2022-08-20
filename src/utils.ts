export class Utils {
    static bytesToHexFormatted(byteArray: number[]) {
        var s = '';
        byteArray.forEach(function (byte) {
            s += '0x'
            s += ('0' + (byte & 0xFF).toString(16)).slice(-2).toUpperCase();
            s += ' '
        });
        return s;
    }
    static byteToHex(byte: number) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2).toUpperCase();;
    }
    static bytesToHexWithoutSpace(byteArray: number[]) {
        var s = '';
        byteArray.forEach(function (byte) {
            s += ('0' + (byte & 0xFF).toString(16)).slice(-2).toUpperCase();
        });
        return s;
    }
    static byteToHexString(uint8arr: number[]) {
        if (!uint8arr) {
            return '';
        }

        var hexStr = '';
        for (var i = 0; i < uint8arr.length; i++) {
            var hex = (uint8arr[i] & 0xff).toString(16);
            hex = (hex.length === 1) ? '0' + hex : hex;
            hexStr += hex;
            hexStr += " ";
        }

        return hexStr.toUpperCase();
    }

    static hexStringToBytes(str: string) {
        if (!str) {
            return new Uint8Array();
        }

        str = str.replace(/\s/g, "");
        var a = [];
        for (var i = 0, len = str.length; i < len; i += 2) {
            a.push(parseInt(str.substr(i, 2), 16));
        }

        return new Uint8Array(a);
    }
}
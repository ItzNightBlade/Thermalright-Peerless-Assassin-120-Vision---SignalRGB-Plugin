export function LcdControlScope() { return "dedicated"; }
export function LCDConsentVersion() { return 1; }

// @ts-nocheck
import LCD from "@SignalRGB/lcd";

class ThermalrightUsbDisplayProtocol {
	constructor() {
		this.initialized = false;
		this.logicalWidth = 320;
		this.logicalHeight = 240;
		this.panelWidth = 240;
		this.panelHeight = 320;
	}

	Initialize() {
		this.sendInitHandshake();

		device.setName("Thermalright Peerless Assassin 120 Vision");
		LCD.initialize({
			width: this.logicalWidth,
			height: this.logicalHeight,
			circular: false
		});

		this.initialized = true;
	}

	getMode() {
		if (typeof pixelMode !== "undefined") {
			return pixelMode;
		}
		return "RGB565 (LE)";
	}

	sendInitHandshake() {
		const initPacket = new Array(512).fill(0);
		initPacket[0] = 0xDA;
		initPacket[1] = 0xDB;
		initPacket[2] = 0xDC;
		initPacket[3] = 0xDD;
		initPacket[12] = 0x01;

		const readBuffer = new Array(512).fill(0);
		const MAX_RETRIES = 5;

		for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
			device.bulk_transfer(0x02, initPacket, 512);
			device.pause(50);

			const raw = device.bulk_transfer(0x81, readBuffer, 512);
			const resp = (raw && raw.data !== undefined) ? raw.data : raw;
			const respLen = (raw && raw.length !== undefined) ? raw.length : (resp ? resp.length : -1);

			if (resp && respLen >= 20 &&
				resp[0] === 0xDA &&
				resp[1] === 0xDB &&
				resp[2] === 0xDC &&
				resp[3] === 0xDD &&
				resp[12] === 0x01) {
				return true;
			}

			device.pause(200);
		}

		return false;
	}

	rotateFrame320x240To240x320(src) {
		const dst = new Array(this.panelWidth * this.panelHeight * 2);
		const srcW = this.logicalWidth;
		const srcH = this.logicalHeight;
		const dstW = this.panelWidth;

		for (let y = 0; y < srcH; y++) {
			const rowOffset = y * srcW * 2;
			for (let x = 0; x < srcW; x++) {
				const srcIdx = rowOffset + x * 2;
				const dx = srcH - 1 - y;
				const dy = x;
				const dstIdx = (dy * dstW + dx) * 2;
				dst[dstIdx] = src[srcIdx];
				dst[dstIdx + 1] = src[srcIdx + 1];
			}
		}

		return dst;
	}

	sendColors() {
		if (!this.initialized) {
			return;
		}

		const mode = this.getMode();
		const format = (mode === "RGB565 (BE / NZXT)") ? "NZXT::RGB565" : "RGB565";

		const lcdData = LCD.getFrame({ format: format });
		if (!lcdData || lcdData.length === 0) {
			return;
		}

		const rotatedData = this.rotateFrame320x240To240x320(lcdData);
		const dataLen = rotatedData.length;

		const header = new Array(20).fill(0);
		header[0] = 0xDA;
		header[1] = 0xDB;
		header[2] = 0xDC;
		header[3] = 0xDD;

		header[4] = 0x02;
		header[6] = 0x01;

		header[8] = this.panelWidth & 0xFF;
		header[9] = (this.panelWidth >> 8) & 0xFF;
		header[10] = this.panelHeight & 0xFF;
		header[11] = (this.panelHeight >> 8) & 0xFF;

		header[12] = 0x02;

		header[16] = dataLen & 0xFF;
		header[17] = (dataLen >> 8) & 0xFF;
		header[18] = (dataLen >> 16) & 0xFF;
		header[19] = (dataLen >> 24) & 0xFF;

		const rawPacket = header.concat(rotatedData);
		const paddedLen = Math.ceil(rawPacket.length / 512) * 512;
		const padCount = paddedLen - rawPacket.length;
		const packet = padCount > 0 ? rawPacket.concat(new Array(padCount).fill(0)) : rawPacket;

		const CHUNK_SIZE = 512;
		for (let offset = 0; offset < packet.length; offset += CHUNK_SIZE) {
			const chunk = packet.slice(offset, offset + CHUNK_SIZE);
			device.bulk_transfer(0x02, chunk, chunk.length);
		}
	}
}

const THERMALRIGHT_HID_LCD = new ThermalrightUsbDisplayProtocol();

export function Name() { return "Thermalright Peerless Assassin 120 Vision"; }
export function VendorId() { return 0x0416; }
export function ProductId() { return 0x5302; }
export function Interface() { return 1; }
export function Publisher() { return "WhirlwindFx"; }
export function Documentation() { return "troubleshooting/thermalright"; }
export function Size() { return [1, 1]; }
export function Type() { return "rawusb"; }
export function DeviceType() { return "lcd"; }
export function SubdeviceController() { return true; }
export function ConflictingProcesses() { return ["TRCC.exe", "USBLCD.exe", "USBLCDNEW.exe"]; }
export function ImageUrl() { return "https://assets.signalrgb.com/devices/default/misc/usb-drive-render.png"; }

/* global
pixelMode:readonly
*/
export function ControllableParameters() {
	return [
		{
			property: "pixelMode",
			group: "",
			label: "Pixel Format",
			description: "Use RGB565 (LE) or RGB565 (BE) if colors are swapped.",
			type: "combobox",
			values: ["RGB565 (LE)", "RGB565 (BE / NZXT)"],
			default: "RGB565 (LE)"
		}
	];
}

export function Initialize() {
	THERMALRIGHT_HID_LCD.Initialize();
}

export function Render() {
	THERMALRIGHT_HID_LCD.sendColors();
}

export function Shutdown(SystemSuspending) {

}
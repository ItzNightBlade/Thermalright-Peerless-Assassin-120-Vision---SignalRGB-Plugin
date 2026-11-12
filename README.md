
# Thermalright Peerless Assassin 120 Vision SignalRGB Plugin

Custom `rawusb` SignalRGB plugin for the **Thermalright Peerless Assassin 120 Vision** (2.8" 320×240 LCD), built to drive the display directly in SignalRGB without running Thermalright's TRCC software in the background.

Built by reverse-engineering Thermalright's TRCC utility (`TRCC.exe` and `USBLCDNEW.dll` using ILSpy and dotPeek) to inspect the USB transfer routines (`FormCZTV` and `DCReadWriteAsync`) and map the WinUSB endpoints, init handshake, portrait framebuffer layout (`240×320`), and 512-byte bulk transfer chunking required by the Nuvoton controller (`0x0416:0x5302`).

## Protocol Summary

- **VID / PID:** `0x0416` / `0x5302` (Interface `1` / `MI_01`, WinUSB)
- **Endpoints:** `0x02` (OUT) / `0x81` (IN)
- **Init Packet (512 bytes):** `DA DB DC DD 00 00 00 00 00 00 00 00 01 00 00 00` + 496 zero bytes
- **Frame Header (20 bytes):** `DA DB DC DD 02 00 01 00 F0 00 40 01 02 00 00 00 <len_le32>` followed by 153,600 bytes of RGB565 pixel data (240×320 native panel layout), zero-padded to a 512-byte boundary and sent in 512-byte chunks

## Installation

1. Completely close **TRCC** (including from the system tray).
2. Create the folder `%USERPROFILE%\Documents\WhirlwindFX\Plugins\Thermalright\`.
3. Copy `thermalright_usbdisplay.js` into that folder.
4. Restart **SignalRGB** (or force-reload plugins). The display will appear under **Devices** as **Thermalright Peerless Assassin 120 Vision**.

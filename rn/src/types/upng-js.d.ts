declare module 'upng-js' {
  interface PNGImage {
    width: number
    height: number
    depth: number
    ctype: number
    frames: ArrayBuffer[]
    tabs: Record<string, string>
  }
  function decode(buffer: ArrayBuffer): PNGImage | null
  function toRGBA8(img: PNGImage): (ArrayBuffer | Uint8Array)[]
}

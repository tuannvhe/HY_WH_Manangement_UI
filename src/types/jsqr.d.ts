declare module 'jsqr' {
  interface QRCode {
    data: string;
    binaryData: Uint8ClampedArray;
    chunks: Array<{ data: Uint8ClampedArray; chunk: number; }>; 
  }

  function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: { inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' }
  ): QRCode | null;

  export default jsQR;
}

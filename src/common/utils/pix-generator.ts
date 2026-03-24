export class PixGenerator {
  private static calculateCRC16(payload: string): string {
    let crc = 0xffff;
    const polynomial = 0x1021;

    for (let i = 0; i < payload.length; i++) {
      let b = payload.charCodeAt(i);
      for (let j = 0; j < 8; j++) {
        let bit = ((b >> (7 - j)) & 1) === 1;
        let c15 = ((crc >> 15) & 1) === 1;
        crc <<= 1;
        if (c15 !== bit) crc ^= polynomial;
      }
    }

    crc &= 0xffff;
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  private static formatField(id: string, value: string): string {
    const length = value.length.toString().padStart(2, "0");
    return `${id}${length}${value}`;
  }

  static generate(params: {
    key: string;
    name: string;
    city: string;
    amount: number;
    description?: string;
    txid?: string;
  }): string {
    const { key, name, city, amount, description, txid = "***" } = params;

    const gui = "br.gov.bcb.pix";
    const merchantAccountInfo = 
      this.formatField("00", gui) + 
      this.formatField("01", key) +
      (description ? this.formatField("02", description) : "");

    let payload = 
      this.formatField("00", "01") + // Payload Format Indicator
      this.formatField("01", "12") + // Point of Initiation Method (Static)
      this.formatField("26", merchantAccountInfo) +
      this.formatField("52", "0000") + // Merchant Category Code
      this.formatField("53", "986") + // Transaction Currency (BRL)
      this.formatField("54", amount.toFixed(2)) + // Transaction Amount
      this.formatField("58", "BR") + // Country Code
      this.formatField("59", name.substring(0, 25)) + // Merchant Name
      this.formatField("60", city.substring(0, 15)) + // Merchant City
      this.formatField("62", this.formatField("05", txid)); // Additional Data (TXID)

    payload += "6304"; // CRC16 ID and Length
    payload += this.calculateCRC16(payload);

    return payload;
  }
}

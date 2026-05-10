import { Module, Global } from "@nestjs/common";
import { BrcodePixProvider } from "../../common/providers/brcode-pix.provider";
import { PixProviderFactory } from "../../common/providers/pix-provider.factory";

@Global()
@Module({
  providers: [BrcodePixProvider, PixProviderFactory],
  exports: [BrcodePixProvider, PixProviderFactory],
})
export class PixProviderModule {}

import { GetTransactionReceiptResponse } from 'starknet';
import { FACTORY_ADDRESS } from '../constants/index.js';

const normalizeAddress = (addr: string | undefined) =>
  addr?.toLowerCase().replace(/^0x0*/, '0x') ?? undefined;

export function extractMemecoinAddressFromReceipt(
  receipt: GetTransactionReceiptResponse,
  factoryAddress: string = FACTORY_ADDRESS
): string | undefined {
  if (!Array.isArray((receipt as any).events)) {
    return undefined;
  }

  const events = (receipt as any).events;
  const normalizedFactoryAddress = normalizeAddress(factoryAddress);

  const factoryEvents = events.filter((ev: any) => {
    const from = normalizeAddress(ev.from_address);
    return from === normalizedFactoryAddress;
  });

  if (factoryEvents.length === 0) {
    return undefined;
  }

  const lastFactoryEvent = factoryEvents[factoryEvents.length - 1];
  const data: string[] = lastFactoryEvent.data ?? [];

  if (!Array.isArray(data) || data.length === 0) {
    return undefined;
  }

  const memecoinAddress = data[data.length - 1];

  return memecoinAddress || undefined;
}

import { expect, describe, it, mock, jest, beforeEach } from "bun:test";
import { getUpdatedSLPrice } from "../../src/ws";
import type { CurrentTrade } from "../../src/algo";
import memCache from "../../src/utils/mem-cache";

// Mock the logger and memCache for testing
mock.module("../utils", () => ({
  safeMemCacheSet: {
    set: jest.fn(),
  },
}));

describe("getUpdatedSLPrice", () => {
  beforeEach(() => {
    memCache.flushAll();
  });
  it("it should change SL to 415 on target price of 430 and update SL when ltp crosses it's last point", async () => {
    const dataStream = [390, 405, 431, 435, 425, 422, 430, 440];
    const currentTrade: CurrentTrade = {
      aiResponse: {
        indexName: "BN",
        ltp: 400,
        strike: 46200,
        type: "CE",
      },
      contract: {
        expiryTs: 12,
        lastUpdateDate: new Date().toISOString(),
        lot: 15,
        name: "BN",
        optionType: "CE",
        scripName: "BN",
        strikePrice: 46200,
        symbol: "BN",
        tick: 0.05,
        tradingSession: "",
      },
    };
    const response = await Promise.all(
      dataStream.map((ltp, idx) => {
        const newSL = getUpdatedSLPrice(ltp, currentTrade);
        return newSL;
      })
    );

    expect(response).toEqual([null, null, 415, 420, null, null, null, 425]);
  });
});

import { BidRecord } from '../shared/types';
 
export type StrategyType = 'STRICT_INCREMENT' | 'FLAT_RATE';
export class Bid {
    public readonly bidId: string;
    public readonly auctionId: string;
    public readonly bidderId: string;
    public readonly amount: number;
    public readonly strategyApplied: StrategyType;
    public readonly timestamp: string; //iso format hna


    public toBidRecord(): BidRecord {    
        return {
            id: this.bidId,
            bidderID: this.bidderId,
            amount: this.amount,
            timestamp: this.timestamp,
        };
    }


    constructor(params: {
        bidId: string;
        auctionId: string;
        bidderId: string;
        amount: number;
        strategyApplied: StrategyType;
        timestamp?: string;
    }) {
        this.bidId = params.bidId;
        this.auctionId = params.auctionId;
        this.bidderId = params.bidderId;
        this.amount = params.amount;
        this.strategyApplied = params.strategyApplied;
        this.timestamp = params.timestamp || new Date().toISOString();

        if (params.amount <= 0) {
            throw new Error('Bid amount must be greater than zero.');
        }   
    }
}
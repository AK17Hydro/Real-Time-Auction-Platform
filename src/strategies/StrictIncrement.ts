import { BiddingStrategy, StrategyMetadata, ValidationResult } from './BiddingStrategy';

export class StrictIncrement implements BiddingStrategy {

    public readonly type = 'STRICT_INCREMENT';
    private readonly step: number;



    constructor(step: number) {
        if (!Number.isFinite(step) || step <= 0) {
            throw new Error('Step must be a positive finite number');
        }
        this.step = Math.round(step*100)/100;
    }



    public validateBid(currentPrice: number, proposedAmount: number): ValidationResult {


        if (!Number.isFinite(proposedAmount) || proposedAmount <= 0) {
            return {
                valid: false,
                normalizedBidAmount: 0,
                reason: 'Proposed bid must be a valid positive number.',
            };
        }

        const normalizedBid = Math.round(proposedAmount * 100) / 100;
        const minRequiredBid = Math.round((currentPrice + this.step) * 100) / 100;



        if (normalizedBid < minRequiredBid) {
            return {
                valid: false,
                normalizedBidAmount: normalizedBid,
                reason: 'Proposed bid is below the required increment.',
            };
        }


        return {
            valid: true,
            normalizedBidAmount: normalizedBid,
            reason: 'Proposed bid is valid.',
        };
    }


    


    public getRuleMetadata(currentPrice: number): StrategyMetadata {

        const nextMinBid = Math.round((currentPrice + this.step) * 100) / 100;

        return {
            type: this.type,
            step: this.step,
            nextMinBid: nextMinBid,
            description: `Bids must be in increments of ${this.step}. Next minimum bid is ${nextMinBid}.`,
        }
    }


}
import { BiddingStrategy, StrategyMetadata, ValidationResult } from './BiddingStrategy';

export class FlatRate implements BiddingStrategy {

    public readonly type = 'FLAT_RATE';
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
        const exactRequiredBid = Math.round((currentPrice + this.step) * 100) / 100;

        if (normalizedBid !== exactRequiredBid) {
            return {
                valid: false,
                normalizedBidAmount: normalizedBid,
                reason: 'Proposed bid must match the exact required amount.',
            };
        }



        return {
            valid: true,
            normalizedBidAmount: normalizedBid,
            reason: 'Proposed bid is valid.',
        };
    }




}
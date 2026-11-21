import { StrategyType } from '../models/Bid';
export interface ValidationResult {
    valid: boolean;
    normalizedBidAmount: number;
    reason?: string; // Optional reason for invalid bid
}

export interface StrategyMetadata {
    type: StrategyType;
    step: number; // The increment step
    nextMinBid: number; 
    description: string;

}
export interface BiddingStrategy {
    readonly type: StrategyType;
    validateBid(currentPrice: number, proposedAmount: number): ValidationResult;
    getRuleMetadata(currentPrice: number): StrategyMetadata;
}


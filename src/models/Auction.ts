import { AuctionDTO, AuctionStatus } from '../shared/types';
import { Bid } from './Bid';
import { BiddingStrategy, StrategyMetadata } from '../strategies/BiddingStrategy';

export class Auction {
    public readonly id: string;
    public readonly title: string;
    public readonly description: string;
    public readonly startingPrice: number;
    public currentPrice: number;
    public status: AuctionStatus;

    public readonly sellerID: string;
    public highestBidderID: string | null;
    private bids: Bid[];


    // ISO format
    public readonly startTime: string; 
    public readonly endTime: string; 

    private biddingStrategy: BiddingStrategy;


    constructor(params: {
        id: string;
        title: string;
        description: string;
        startingPrice: number;
        sellerID: string;
        startTime: string;
        endTime: string;
        strategy: BiddingStrategy;
        
    }) {
        if (!Number.isFinite(params.startingPrice) || params.startingPrice < 0) {
            throw new Error('Invalid starting price');
        }

        this.id = params.id;
        this.title = params.title;
        this.description = params.description;
        this.startingPrice = Math.round(params.startingPrice * 100) / 100;
        this.currentPrice = this.startingPrice;
        this.sellerID = params.sellerID;
        this.highestBidderID = null;
        this.bids = [];
        this.status = 'SCHEDULED';
        this.startTime = params.startTime;
        this.endTime = params.endTime;
        this.biddingStrategy = params.strategy;
    }





}

export type AuctionStatus = 'LIVE' | 'SCHEDULED' | 'CLOSED';

export type AuctionCategory = 'ELECTRONICS' | 'VEHICLES' | 'COLLECTIBLES' | 'FASHION' | 'HOME' | 'OTHER';

export interface BidRecord {
    id: string;
    bidderID: string;
    amount: number;
    timestamp: string; // ISO format for time
}

export interface AuctionDTO {
    id: string;
    title: string;
    description: string;
    category: AuctionCategory;


    startingPrice: number;
    currentPrice: number;
    status: AuctionStatus;

    sellerID: string;
    highestBidderID: string | null; 
    bids: BidRecord[]; 

    // ISO format for time
    startTime: string;        
    endTime: string;
}
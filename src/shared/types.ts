
export type AuctionStatus = 'LIVE' | 'SCHEDULED' | 'CLOSED';

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

export type NotificationType =
    | 'AUCTION_STARTED'
    | 'NEW_BID_ALERT'
    | 'NEW_LISTING';

export interface NotificationMessage {
    type: NotificationType;
    auctionId?: string;
    senderId?: string;
    payload: unknown;
    timestamp: string;
}

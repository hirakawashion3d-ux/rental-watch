export type PropertyRank = "A" | "B" | "CHECK" | "HOLD" | "ENDED";
export type ListingStatus = "active" | "needs_confirmation" | "on_hold" | "ended" | "invalid_url" | "applied" | "reference" | "unknown";
export interface PropertyLink { label: string; url: string; status: ListingStatus; checkedAt?: string; updatedAt?: string; note?: string; }
export interface Property {
  id: string; name: string; room?: string; rank: PropertyRank; status: ListingStatus; summary: string;
  address?: string; areaName: string; totalMonthlyCost: number; rent?: number; managementFee?: number;
  deposit?: string | number; keyMoney?: string | number; layout: string; area: number; built?: string;
  floor?: number; totalFloors?: number; direction?: string; stations: { name: string; minutes: number | string }[];
  commute?: { shibuya?: string; toranomon?: string; suitenngu?: string; ningyocho?: string };
  occupancy?: { twoPeople?: boolean; cohabitation?: boolean; roomShare?: boolean; singleOnly?: boolean; evidence?: string };
  amenities: string[]; pet?: string; soundproofing?: string;
  layoutReview?: { noJapaneseRoomEvidence?: string; bedPosition?: string; deskPosition?: string; diningPosition?: string; circulation?: string; bedSeparated?: boolean; narrowRailroadLayout?: boolean; furnitureFlexibility?: string; coupleLiving?: string; notes?: string[] };
  buildingReview?: { ageEvaluation?: string; renovation?: string; plumbing?: string; commonArea?: string; seismic?: string; soundproofing?: string; firstFloorRisk?: string; flooding?: string; sunlight?: string; humidity?: string; outsideView?: string; garbageDistance?: string };
  availability?: { occupancyStatus?: string; moveInDate?: string; listingUpdatedAt?: string; phoneCheckRequired?: boolean; consistency?: string; urlCheck?: string; notes?: string };
  links: PropertyLink[]; firstSeenAt: string; lastCheckedAt: string; updatedAt: string;
}
export interface PropertyUpdate { id: string; propertyId: string; timestamp: string; type: "new" | "relisted" | "price_drop" | "vacancy" | "rank_change" | "status_change" | "ended" | "correction" | "condition_change"; title: string; description: string; previousValue?: string; newValue?: string; links?: PropertyLink[]; }

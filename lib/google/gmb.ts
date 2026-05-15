// ---------------------------------------------------------------------------
// Google Business Profile API wrapper
// ---------------------------------------------------------------------------
// IMPORTANTE: A "Google My Business API" foi descontinuada em 2022. As APIs
// atuais são:
// - Account Management API:    mybusinessaccountmanagement.googleapis.com/v1
// - Business Information API:  mybusinessbusinessinformation.googleapis.com/v1
// - Reviews API (legacy v4):    mybusiness.googleapis.com/v4   ← ainda em uso
// - Local Posts (legacy v4):    mybusiness.googleapis.com/v4   ← ainda em uso
//
// O acesso PRECISA ser aprovado pelo Google (formulário "Business Profile
// APIs access"). Sem a aprovação, as chamadas retornam 403 PERMISSION_DENIED.
// Implementamos os wrappers reais — se 403, a UI degrada graciosamente.
// ---------------------------------------------------------------------------

const ACCOUNT_MGMT = "https://mybusinessaccountmanagement.googleapis.com/v1";
const BUSINESS_INFO = "https://mybusinessbusinessinformation.googleapis.com/v1";
const LEGACY_V4 = "https://mybusiness.googleapis.com/v4";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GmbAccount {
  name: string; // accounts/{accountId}
  accountName: string;
  type: string;
  role?: string;
  verificationState?: string;
}

export interface GmbLocation {
  name: string; // locations/{locationId}
  title: string;
  storefrontAddress?: {
    regionCode: string;
    languageCode?: string;
    postalCode?: string;
    administrativeArea?: string;
    locality?: string;
    addressLines?: string[];
  };
  primaryCategory?: { displayName: string; categoryId: string };
  websiteUri?: string;
  phoneNumbers?: { primaryPhone?: string };
  metadata?: { hasGoogleUpdated?: boolean; placeId?: string };
}

export interface GmbReview {
  name: string; // accounts/{a}/locations/{l}/reviews/{r}
  reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string; isAnonymous?: boolean };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

export interface GmbLocalPost {
  name?: string;
  languageCode: string;
  summary: string;
  callToAction?: {
    actionType: string; // LEARN_MORE | BOOK | CALL | SIGN_UP | SHOP | ORDER
    url?: string;
  };
  media?: { mediaFormat: string; sourceUrl: string }[];
  topicType?: string; // STANDARD | EVENT | OFFER | ALERT
}

// ---------------------------------------------------------------------------
// Custom error — usado para sinalizar 403 (sem acesso ao programa)
// ---------------------------------------------------------------------------
export class GmbApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown
  ) {
    super(message);
    this.name = "GmbApiError";
  }
}

async function fetchGmb<T>(
  url: string,
  accessToken: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let detail: unknown = text;
    try {
      detail = JSON.parse(text);
    } catch {
      /* keep text */
    }
    throw new GmbApiError(
      `Google Business API ${res.status}: ${res.statusText}`,
      res.status,
      detail
    );
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Account & Location discovery
// ---------------------------------------------------------------------------

export async function listAccounts(accessToken: string): Promise<GmbAccount[]> {
  const data = await fetchGmb<{ accounts?: GmbAccount[] }>(
    `${ACCOUNT_MGMT}/accounts`,
    accessToken
  );
  return data.accounts ?? [];
}

export async function listLocations(
  accessToken: string,
  accountName: string // "accounts/{accountId}"
): Promise<GmbLocation[]> {
  // readMask é obrigatório na Business Information API
  const readMask = [
    "name",
    "title",
    "storefrontAddress",
    "primaryCategory",
    "websiteUri",
    "phoneNumbers",
    "metadata",
  ].join(",");

  const data = await fetchGmb<{ locations?: GmbLocation[] }>(
    `${BUSINESS_INFO}/${accountName}/locations?readMask=${readMask}`,
    accessToken
  );
  return data.locations ?? [];
}

// ---------------------------------------------------------------------------
// Profile (description, services, categories)
// ---------------------------------------------------------------------------

export async function updateLocationProfile(
  accessToken: string,
  locationName: string, // "locations/{locationId}"
  updates: {
    profileDescription?: string;
    primaryCategory?: { categoryId: string };
    additionalCategories?: { categoryId: string }[];
  }
): Promise<void> {
  const updateMask = Object.keys(updates).join(",");

  await fetchGmb(
    `${BUSINESS_INFO}/${locationName}?updateMask=${updateMask}`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify({
        profile: { description: updates.profileDescription },
        categories: updates.primaryCategory
          ? {
              primaryCategory: updates.primaryCategory,
              additionalCategories: updates.additionalCategories,
            }
          : undefined,
      }),
    }
  );
}

// ---------------------------------------------------------------------------
// Reviews (Legacy v4)
// ---------------------------------------------------------------------------

const STAR_TO_NUMBER: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export function starRatingToNumber(rating: GmbReview["starRating"]): number {
  return STAR_TO_NUMBER[rating] ?? 0;
}

export async function listReviews(
  accessToken: string,
  accountName: string, // "accounts/{a}"
  locationName: string // "locations/{l}"
): Promise<GmbReview[]> {
  // accountName e locationName precisam ser strings sem o prefixo "accounts/" ou "locations/"
  const a = accountName.replace(/^accounts\//, "");
  const l = locationName.replace(/^locations\//, "");

  const data = await fetchGmb<{ reviews?: GmbReview[] }>(
    `${LEGACY_V4}/accounts/${a}/locations/${l}/reviews`,
    accessToken
  );
  return data.reviews ?? [];
}

export async function replyToGoogleReview(
  accessToken: string,
  accountName: string,
  locationName: string,
  reviewId: string,
  comment: string
): Promise<void> {
  const a = accountName.replace(/^accounts\//, "");
  const l = locationName.replace(/^locations\//, "");

  await fetchGmb(
    `${LEGACY_V4}/accounts/${a}/locations/${l}/reviews/${reviewId}/reply`,
    accessToken,
    {
      method: "PUT",
      body: JSON.stringify({ comment }),
    }
  );
}

// ---------------------------------------------------------------------------
// Local Posts (Legacy v4)
// ---------------------------------------------------------------------------

export async function createLocalPost(
  accessToken: string,
  accountName: string,
  locationName: string,
  post: GmbLocalPost
): Promise<{ name: string }> {
  const a = accountName.replace(/^accounts\//, "");
  const l = locationName.replace(/^locations\//, "");

  return fetchGmb<{ name: string }>(
    `${LEGACY_V4}/accounts/${a}/locations/${l}/localPosts`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(post),
    }
  );
}

// ---------------------------------------------------------------------------
// OAuth scope — precisa ser adicionado ao auth flow
// ---------------------------------------------------------------------------
export const GMB_OAUTH_SCOPE = "https://www.googleapis.com/auth/business.manage";

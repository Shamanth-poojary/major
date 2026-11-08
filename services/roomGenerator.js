/**
 * services/roomGenerator.js
 * Generates sensible room types, amenities, and pricing policies
 * based on listing details (title, description, price, business type).
 * Used by both backfill seed and owner dashboard "Generate Rooms" action.
 */

"use strict";

function roundPrice(val) {
  return Math.round(Number(val) / 50) * 50;
}

/**
 * Classify a listing into a broad category:
 * 'venue' | 'villa' | 'hotel' | 'homestay' | 'standard_stay'
 */
function classifyListing(listing) {
  const text = `${listing.title || ""} ${listing.description || ""} ${listing.business_type || ""}`.toLowerCase();

  if (
    text.includes("venue") ||
    text.includes("banquet") ||
    text.includes("lawn") ||
    text.includes("event") ||
    text.includes("convention") ||
    text.includes("hall")
  ) {
    return "venue";
  }

  if (
    text.includes("villa") ||
    text.includes("cottage") ||
    text.includes("bungalow") ||
    text.includes("chalet") ||
    text.includes("entire home") ||
    text.includes("entire house") ||
    text.includes("farmhouse")
  ) {
    return "villa";
  }

  if (
    text.includes("resort") ||
    text.includes("luxury") ||
    text.includes("palace") ||
    text.includes("grand")
  ) {
    return "resort";
  }

  if (
    text.includes("homestay") ||
    text.includes("apartment") ||
    text.includes("studio") ||
    text.includes("bnb") ||
    text.includes("bed & breakfast")
  ) {
    return "homestay";
  }

  return "hotel";
}

/**
 * Generate suggested room types for a listing.
 * @param {Object} listing - { listing_id, title, description, price, business_type, image_url }
 * @returns {Array<Object>} Array of proposed room type objects
 */
function generateRoomTypes(listing) {
  const basePrice = Math.max(500, Number(listing.price) || 2000);
  const type = classifyListing(listing);
  const title = listing.title || "WanderLust Property";

  switch (type) {
    case "venue":
      return [
        {
          name: "Grand Banquet Hall",
          description: `Spacious indoor banquet hall at ${title}, ideal for weddings, galas, and corporate events. Fully air-conditioned with stage and AV setup.`,
          category: "hall",
          bed_config: "Banquet / Theater Seating",
          size_sqft: 4500,
          max_guests: 350,
          price_per_night: roundPrice(basePrice),
          total_units: 1,
          amenities: [
            "Air Conditioning",
            "Conference Projector & AV Screen",
            "Pro PA Sound & Stage Lighting",
            "Raised Speaker Stage & Podium",
            "Banquet Catering Kitchen & Dining",
            "Free Parking on Premises",
            "Electric Generator / Power Backup",
          ],
        },
        {
          name: "Open-Air Event Lawn",
          description: `Expansive manicured lawn at ${title} for outdoor receptions, gatherings, and celebrations under the stars.`,
          category: "hall",
          bed_config: "Open Grounds",
          size_sqft: 8000,
          max_guests: 500,
          price_per_night: roundPrice(basePrice * 1.2),
          total_units: 1,
          amenities: [
            "Free Parking on Premises",
            "Pro PA Sound & Stage Lighting",
            "Banquet Catering Kitchen & Dining",
            "Electric Generator / Power Backup",
          ],
        },
        {
          name: "Executive Meeting Space",
          description: `Dedicated conference and seminar hall at ${title} equipped with smart presentation systems and high-speed WiFi.`,
          category: "hall",
          bed_config: "Boardroom Table (25 Pax)",
          size_sqft: 900,
          max_guests: 30,
          price_per_night: roundPrice(basePrice * 0.4),
          total_units: 2,
          amenities: [
            "Free High-Speed WiFi",
            "Air Conditioning",
            "Conference Projector & AV Screen",
            "Dedicated Workspace",
            "Free Parking on Premises",
          ],
        },
      ];

    case "villa":
      return [
        {
          name: `Entire Villa at ${title}`,
          description: `Complete private booking of ${title}. Includes private living rooms, curated garden or terrace, and personalized guest services.`,
          category: "entire_property",
          bed_config: "3 King Beds + 2 Sofa Beds",
          size_sqft: 3200,
          max_guests: 8,
          price_per_night: roundPrice(basePrice),
          total_units: 1,
          amenities: [
            "Free High-Speed WiFi",
            "Air Conditioning",
            "Smart TV with Streaming",
            "Equipped Kitchenette",
            "Hot Water & Shower",
            "Free Parking on Premises",
            "Balcony / Terrace",
            "Swimming Pool Access",
            "Electric Generator / Power Backup",
          ],
        },
      ];

    case "resort":
      return [
        {
          name: "Deluxe Garden View Room",
          description: `Charming and serene deluxe room overlooking tranquil gardens at ${title}. Equipped with premium bedding and modern comforts.`,
          category: "deluxe",
          bed_config: "1 King Bed or 2 Twins",
          size_sqft: 420,
          max_guests: 2,
          price_per_night: roundPrice(basePrice),
          total_units: 8,
          amenities: [
            "Free High-Speed WiFi",
            "Air Conditioning",
            "Smart TV with Streaming",
            "Hot Water & Shower",
            "Complimentary Breakfast",
            "Balcony / Terrace",
            "Swimming Pool Access",
          ],
        },
        {
          name: "Royal Heritage Suite",
          description: `Luxurious suite at ${title} featuring a standalone soaking tub, private panoramic balcony, and dedicated butler concierge.`,
          category: "suite",
          bed_config: "1 California King Bed",
          size_sqft: 750,
          max_guests: 3,
          price_per_night: roundPrice(basePrice * 1.5),
          total_units: 4,
          amenities: [
            "Free High-Speed WiFi",
            "Air Conditioning",
            "Smart TV with Streaming",
            "Hot Water & Shower",
            "Complimentary Breakfast",
            "Balcony / Terrace",
            "Swimming Pool Access",
            "24/7 Room Service & Concierge",
            "Dedicated Workspace",
          ],
        },
        {
          name: "Family Panorama Villa Suite",
          description: `Expansive family quarters at ${title} offering interconnected living spaces, double vanities, and direct resort amenities access.`,
          category: "family",
          bed_config: "2 King Beds + 1 Daybed",
          size_sqft: 980,
          max_guests: 5,
          price_per_night: roundPrice(basePrice * 1.8),
          total_units: 2,
          amenities: [
            "Free High-Speed WiFi",
            "Air Conditioning",
            "Smart TV with Streaming",
            "Hot Water & Shower",
            "Complimentary Breakfast",
            "Balcony / Terrace",
            "Swimming Pool Access",
            "Free Parking on Premises",
          ],
        },
      ];

    case "homestay":
      return [
        {
          name: "Cozy Private Bedroom",
          description: `Warm, hospitable private room at ${title}. Features comfortable bedding, natural light, and access to home amenities.`,
          category: "standard",
          bed_config: "1 Queen Bed",
          size_sqft: 280,
          max_guests: 2,
          price_per_night: roundPrice(basePrice * 0.85),
          total_units: 3,
          amenities: [
            "Free High-Speed WiFi",
            "Hot Water & Shower",
            "Complimentary Breakfast",
            "Dedicated Workspace",
          ],
        },
        {
          name: "Entire Apartment / Floor",
          description: `Private full-floor rental at ${title} complete with self-catering kitchenette, living lounge, and private balcony.`,
          category: "entire_property",
          bed_config: "2 Queen Beds",
          size_sqft: 950,
          max_guests: 4,
          price_per_night: roundPrice(basePrice * 1.4),
          total_units: 1,
          amenities: [
            "Free High-Speed WiFi",
            "Air Conditioning",
            "Smart TV with Streaming",
            "Equipped Kitchenette",
            "Hot Water & Shower",
            "Balcony / Terrace",
            "Free Parking on Premises",
          ],
        },
      ];

    case "hotel":
    default:
      return [
        {
          name: "Standard Classic Room",
          description: `Comfortable and functional room at ${title} with essential modern amenities, premium mattress, and workspace.`,
          category: "standard",
          bed_config: "1 Queen Bed",
          size_sqft: 260,
          max_guests: 2,
          price_per_night: roundPrice(basePrice),
          total_units: 10,
          amenities: [
            "Free High-Speed WiFi",
            "Air Conditioning",
            "Hot Water & Shower",
            "Dedicated Workspace",
          ],
        },
        {
          name: "Deluxe City / Nature View Room",
          description: `Upgraded room at ${title} featuring enhanced views, complimentary breakfast, smart entertainment, and sound insulation.`,
          category: "deluxe",
          bed_config: "1 King Bed",
          size_sqft: 360,
          max_guests: 2,
          price_per_night: roundPrice(basePrice * 1.3),
          total_units: 6,
          amenities: [
            "Free High-Speed WiFi",
            "Air Conditioning",
            "Smart TV with Streaming",
            "Hot Water & Shower",
            "Complimentary Breakfast",
            "Balcony / Terrace",
          ],
        },
        {
          name: "Executive Luxury Suite",
          description: `Premier accommodation at ${title} with separate sitting lounge, executive desk, walk-in shower, and complimentary room perks.`,
          category: "suite",
          bed_config: "1 King Bed + 1 Sofa Bed",
          size_sqft: 580,
          max_guests: 3,
          price_per_night: roundPrice(basePrice * 1.75),
          total_units: 3,
          amenities: [
            "Free High-Speed WiFi",
            "Air Conditioning",
            "Smart TV with Streaming",
            "Hot Water & Shower",
            "Complimentary Breakfast",
            "Balcony / Terrace",
            "Dedicated Workspace",
            "24/7 Room Service & Concierge",
          ],
        },
      ];
  }
}

/**
 * Default payment policy for a listing.
 */
function getDefaultPaymentPolicy() {
  return {
    allow_advance: true,
    advance_type: "percent",
    advance_value: 25.0,
  };
}

module.exports = {
  classifyListing,
  generateRoomTypes,
  getDefaultPaymentPolicy,
  roundPrice,
};

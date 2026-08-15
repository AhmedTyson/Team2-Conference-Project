/**
 * unsplash-helper.js — Smart Unsplash External Image Resolver
 * Provides reliable high-resolution Unsplash images for cities, countries, restaurants, hotels & attractions.
 */
(function (global) {
  "use strict";

  var It = global.Itinari || (global.Itinari = {});

  var UNSPLASH_IMAGES = {
    // Cities
    paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80",
    tokyo: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
    rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80",
    london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
    dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
    cairo: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80",
    santorini: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80",
    barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80",
    venice: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=800&q=80",
    sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80",
    berlin: "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=80",

    // Restaurants
    restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    dining: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80",
    bistro: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80",
    bar: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80",
    italian: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=800&q=80",
    sushi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    steakhouse: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    cafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",

    // Hotels
    hotel: "https://images.unsplash.com/photo-1566073171639-4d8ef58f4a13?auto=format&fit=crop&w=800&q=80",
    resort: "https://images.unsplash.com/photo-1542314831-c6a4d142104d?auto=format&fit=crop&w=800&q=80",
    boutique: "https://images.unsplash.com/photo-1551882547-ff40c0d83b44?auto=format&fit=crop&w=800&q=80",

    // Attractions
    attraction: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80",
    museum: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=800&q=80",
    pyramid: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80",
  };

  function getUnsplashImage(name, type, country) {
    var query = (String(name || "") + " " + String(country || "") + " " + String(type || "")).toLowerCase();

    for (var key in UNSPLASH_IMAGES) {
      if (query.indexOf(key) !== -1) {
        return UNSPLASH_IMAGES[key];
      }
    }

    if (type === "restaurants" || query.indexOf("food") !== -1 || query.indexOf("chef") !== -1) {
      return UNSPLASH_IMAGES.restaurant;
    }
    if (type === "hotels" || query.indexOf("stay") !== -1 || query.indexOf("villas") !== -1) {
      return UNSPLASH_IMAGES.hotel;
    }
    if (type === "attractions") {
      return UNSPLASH_IMAGES.attraction;
    }

    return UNSPLASH_IMAGES.paris;
  }

  It.getUnsplashImage = getUnsplashImage;
  It.UNSPLASH_IMAGES = UNSPLASH_IMAGES;
})(window);

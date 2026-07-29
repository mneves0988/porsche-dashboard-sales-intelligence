import { useState, useEffect, useMemo, useCallback } from "react";

export interface SalesRecord {
  sale_id: string;
  SaleDate: string;
  customer_name: string;
  Model: string;
  ModelYear: string;
  Price: string;
  Mileage: string;
  PayMethod: string;
  City: string;
  State: string;
  salesperson: string;
  Status: string;
}

export interface DashboardData {
  records: SalesRecord[];
  models: string[];
  years: number[];
  cities: string[];
  pay_methods: string[];
  states: string[];
  kpis: {
    total_sales: number;
    total_revenue: number;
    avg_ticket: number;
    unique_cities: number;
    unique_states: number;
    top_model: string;
    top_city: string;
    top_year: number;
    top_pay_method: string;
  };
  sales_by_model: Record<string, number>;
  sales_by_family: Record<string, number>;
  revenue_by_model: Record<string, { revenue: number; count: number }>;
  revenue_by_family: Record<string, { revenue: number; count: number }>;
  sales_by_year: Record<number, number>;
  sales_by_pay: Record<string, number>;
  top_cities_revenue: Record<string, { revenue: number; count: number }>;
  top_states: Record<string, number>;
  status_distribution: Record<string, number>;
  models_by_city: Record<string, { model: string; sales: number; revenue: number }>;
  top5_models: Record<string, number>;
  top5_cities: Record<string, number>;
  top5_pay: Record<string, number>;
  executive_summary: string;
}

interface Filters {
  models: string[];
  year: string;
  cities: string[];
  payMethods: string[];
  dateStart: string;
  dateEnd: string;
}

interface AggregatedData {
  filteredCount: number;
  kpis: {
    total_sales: number;
    total_revenue: number;
    avg_ticket: number;
    unique_cities: number;
    unique_states: number;
    top_model: string;
    top_city: string;
    top_year: number;
    top_pay_method: string;
  };
  salesByModel: Record<string, number>;
  salesByFamily: Record<string, number>;
  revenueByModel: Record<string, { revenue: number; count: number }>;
  revenueByFamily: Record<string, { revenue: number; count: number }>;
  salesByYear: Record<string, number>;
  salesByPay: Record<string, number>;
  topCitiesRevenue: Record<string, { revenue: number; count: number }>;
  topStates: Record<string, number>;
  statusDist: Record<string, number>;
  modelsByCity: Record<string, { model: string; sales: number; revenue: number }>;
  top5Models: Record<string, number>;
  top5Cities: Record<string, number>;
  top5Pay: Record<string, number>;
  executiveSummary: string;
  filteredRecords: SalesRecord[];
  validPayMethods: string[];
  validModels: string[];
  validYears: string[];
  validCities: string[];
  dateRange: { min: string; max: string };
  cityDataForMap: { city: string; state: string; lat: number; lng: number; revenue: number; count: number }[];
}

function sortEntries(arr: [string, number | { revenue: number; count: number }][], key: "revenue" | "count" | "value", desc = true) {
  return [...arr].sort((a, b) => {
    const va = typeof a[1] === "number" ? a[1] : (a[1] as any)[key] || 0;
    const vb = typeof b[1] === "number" ? b[1] : (b[1] as any)[key] || 0;
    return desc ? vb - va : va - vb;
  });
}

/**
 * Unify payment methods that are written differently but mean the same thing.
 */
function unifyPayMethod(pm: string): string {
  if (!pm) return "Unknown";
  const lower = pm.toLowerCase().replace(/[_\s]/g, "").trim();
  
  if (["wiretransfer", "wire", "wiretransfer", "wiretransfer"].includes(lower) || lower === "wiretransfer" || lower === "wire") {
    return "Wire Transfer";
  }
  if (["banktransfer", "bank_wire", "bankwire", "bank_transfer"].includes(lower)) {
    return "Bank Transfer";
  }
  if (["creditcard", "credit", "creditcardpayment"].includes(lower) || lower.startsWith("credit")) {
    return "Credit Card";
  }
  if (["cash", "cashpayment"].includes(lower) || lower === "cash") {
    return "Cash";
  }
  if (["financing", "finance", "leasing", "leaseplan", "lease"].includes(lower)) {
    return "Financing";
  }
  if (lower === "debitcard") {
    return "Debit Card";
  }
  if (lower === "achpayment") {
    return "ACH Payment";
  }
  if (lower === "cryptopayment" || lower === "crypto") {
    return "Crypto";
  }

  return pm;
}

function isValidRecord(r: SalesRecord): boolean {
  if (r.SaleDate === "INVALID") return false;
  if (!r.Model || r.Model.trim() === "" || r.Model === "nan") return false;
  if (!r.City || r.City.trim() === "" || r.City === "nan") return false;
  
  const price = parseFloat(r.Price);
  if (isNaN(price) || price <= 0 || price < 1000) return false;
  
  return true;
}

/**
 * City to lat/lng mapping for US cities (approximate)
 */
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "New York": { lat: 40.7128, lng: -74.0060 },
  "Los Angeles": { lat: 34.0522, lng: -118.2437 },
  "Chicago": { lat: 41.8781, lng: -87.6298 },
  "Houston": { lat: 29.7604, lng: -95.3698 },
  "Phoenix": { lat: 33.4484, lng: -112.0740 },
  "Philadelphia": { lat: 39.9526, lng: -75.1652 },
  "San Antonio": { lat: 29.4241, lng: -98.4936 },
  "San Diego": { lat: 32.7157, lng: -117.1611 },
  "Dallas": { lat: 32.7767, lng: -96.7970 },
  "San Jose": { lat: 37.3382, lng: -121.8863 },
  "Austin": { lat: 30.2672, lng: -97.7431 },
  "Jacksonville": { lat: 30.3322, lng: -81.6557 },
  "Fort Worth": { lat: 32.7555, lng: -97.3308 },
  "Columbus": { lat: 39.9612, lng: -82.9988 },
  "Charlotte": { lat: 35.2271, lng: -80.8431 },
  "Indianapolis": { lat: 39.7684, lng: -86.1581 },
  "San Francisco": { lat: 37.7749, lng: -122.4194 },
  "Seattle": { lat: 47.6062, lng: -122.3321 },
  "Denver": { lat: 39.7392, lng: -104.9903 },
  "Washington": { lat: 38.9072, lng: -77.0369 },
  "Nashville": { lat: 36.1627, lng: -86.7816 },
  "Oklahoma City": { lat: 35.4676, lng: -97.5164 },
  "El Paso": { lat: 31.7619, lng: -106.4850 },
  "Boston": { lat: 42.3601, lng: -71.0589 },
  "Portland": { lat: 45.5152, lng: -122.6784 },
  "Las Vegas": { lat: 36.1699, lng: -115.1398 },
  "Memphis": { lat: 35.1495, lng: -90.0490 },
  "Louisville": { lat: 38.2527, lng: -85.7585 },
  "Baltimore": { lat: 39.2904, lng: -76.6122 },
  "Milwaukee": { lat: 43.0389, lng: -87.9065 },
  "Albuquerque": { lat: 35.0844, lng: -106.6504 },
  "Tucson": { lat: 32.2226, lng: -110.9747 },
  "Fresno": { lat: 36.7378, lng: -119.7871 },
  "Sacramento": { lat: 38.5816, lng: -121.4944 },
  "Kansas City": { lat: 39.0997, lng: -94.5786 },
  "Mesa": { lat: 33.4152, lng: -111.8315 },
  "Atlanta": { lat: 33.7490, lng: -84.3880 },
  "Omaha": { lat: 41.2565, lng: -95.9345 },
  "Colorado Springs": { lat: 38.8339, lng: -104.8214 },
  "Raleigh": { lat: 35.7796, lng: -78.6382 },
  "Long Beach": { lat: 33.7701, lng: -118.1937 },
  "Virginia Beach": { lat: 36.8529, lng: -75.9780 },
  "Miami": { lat: 25.7617, lng: -80.1918 },
  "Minneapolis": { lat: 44.9778, lng: -93.2650 },
  "Tulsa": { lat: 36.1540, lng: -95.9928 },
  "Tampa": { lat: 27.9506, lng: -82.4572 },
  "New Orleans": { lat: 29.9511, lng: -90.0715 },
  "Cleveland": { lat: 41.4993, lng: -81.6944 },
  "Bakersfield": { lat: 35.3733, lng: -119.0187 },
  "Wichita": { lat: 37.6872, lng: -97.3301 },
  "Arlington": { lat: 32.7357, lng: -97.1081 },
  "Aurora": { lat: 39.7294, lng: -104.8319 },
  "Anaheim": { lat: 33.8366, lng: -117.9143 },
  "Santa Ana": { lat: 33.7455, lng: -117.8677 },
  "St. Louis": { lat: 38.6270, lng: -90.1994 },
  "Riverside": { lat: 33.9533, lng: -117.3962 },
  "Corpus Christi": { lat: 27.8006, lng: -97.3964 },
  "Lexington": { lat: 38.0406, lng: -84.5037 },
  "Pittsburgh": { lat: 40.4406, lng: -79.9959 },
  "Anchorage": { lat: 61.2181, lng: -149.9003 },
  "Stockton": { lat: 37.9577, lng: -121.2908 },
  "Cincinnati": { lat: 39.1031, lng: -84.5120 },
  "St. Paul": { lat: 44.9537, lng: -93.0900 },
  "Toledo": { lat: 41.6528, lng: -83.5379 },
  "Greensboro": { lat: 36.0726, lng: -79.7920 },
  "Newark": { lat: 40.7357, lng: -74.1724 },
  "Plano": { lat: 33.0198, lng: -96.6989 },
  "Henderson": { lat: 36.0395, lng: -114.9817 },
  "Lincoln": { lat: 40.8136, lng: -96.7026 },
  "Buffalo": { lat: 42.8864, lng: -78.8784 },
  "Jersey City": { lat: 40.7178, lng: -74.0431 },
  "Chula Vista": { lat: 32.6401, lng: -117.0842 },
  "Fort Wayne": { lat: 41.0793, lng: -85.1394 },
  "Orlando": { lat: 28.5383, lng: -81.3792 },
  "St. Petersburg": { lat: 27.7676, lng: -82.6403 },
  "Chandler": { lat: 33.3062, lng: -111.8413 },
  "Laredo": { lat: 27.5306, lng: -99.4803 },
  "Norfolk": { lat: 36.8508, lng: -76.2859 },
  "Durham": { lat: 35.9940, lng: -78.8986 },
  "Madison": { lat: 43.0731, lng: -89.4012 },
  "Lubbock": { lat: 33.5779, lng: -101.8552 },
  "Irvine": { lat: 33.6846, lng: -117.8265 },
  "Winston-Salem": { lat: 36.0999, lng: -80.2442 },
  "Glendale": { lat: 33.5387, lng: -112.1860 },
  "Garland": { lat: 32.9126, lng: -96.6389 },
  "Hialeah": { lat: 25.8576, lng: -80.2781 },
  "Reno": { lat: 39.5296, lng: -119.8138 },
  "Chesapeake": { lat: 36.7682, lng: -76.2875 },
  "Gilbert": { lat: 33.3528, lng: -111.7890 },
  "Baton Rouge": { lat: 30.4515, lng: -91.1871 },
  "Irving": { lat: 32.8140, lng: -96.9489 },
  "Scottsdale": { lat: 33.4942, lng: -111.9261 },
  "North Las Vegas": { lat: 36.1989, lng: -115.1175 },
  "Fremont": { lat: 37.5485, lng: -121.9886 },
  "Boise": { lat: 43.6150, lng: -116.2023 },
  "Richmond": { lat: 37.5407, lng: -77.4360 },
  "San Bernardino": { lat: 34.1083, lng: -117.2898 },
  "Birmingham": { lat: 33.5186, lng: -86.8104 },
  "Spokane": { lat: 47.6588, lng: -117.4260 },
  "Rochester": { lat: 43.1566, lng: -77.6088 },
  "Des Moines": { lat: 41.5868, lng: -93.6250 },
  "Modesto": { lat: 37.6391, lng: -120.9969 },
  "Fayetteville": { lat: 35.0527, lng: -78.8784 },
  "Tacoma": { lat: 47.2529, lng: -122.4443 },
  "Oxnard": { lat: 34.1975, lng: -119.1771 },
  "Fontana": { lat: 34.0922, lng: -117.4350 },
  "Montgomery": { lat: 32.3792, lng: -86.3077 },
  "Moreno Valley": { lat: 33.9425, lng: -117.2297 },
  "Shreveport": { lat: 32.5252, lng: -93.7502 },
  "Yonkers": { lat: 40.9312, lng: -73.8987 },
  "Akron": { lat: 41.0814, lng: -81.5190 },
  "Huntington Beach": { lat: 33.6595, lng: -117.9988 },
  "Little Rock": { lat: 34.7465, lng: -92.2896 },
  "Augusta": { lat: 33.4735, lng: -82.0105 },
  "Amarillo": { lat: 35.2220, lng: -101.8313 },
  "Mobile": { lat: 30.6954, lng: -88.0399 },
  "Grand Rapids": { lat: 42.9634, lng: -85.6681 },
  "Salt Lake City": { lat: 40.7608, lng: -111.8910 },
  "Tallahassee": { lat: 30.4383, lng: -84.2807 },
  "Huntsville": { lat: 34.7304, lng: -86.5861 },
  "Grand Prairie": { lat: 32.7459, lng: -96.9978 },
  "Knoxville": { lat: 35.9606, lng: -83.9207 },
  "Worcester": { lat: 42.2626, lng: -71.8023 },
  "Newport News": { lat: 37.0871, lng: -76.4730 },
  "Brownsville": { lat: 25.9018, lng: -97.4975 },
  "Overland Park": { lat: 38.9822, lng: -94.6708 },
  "Santa Clarita": { lat: 34.3917, lng: -118.5426 },
  "Providence": { lat: 41.8240, lng: -71.4128 },
  "Garden Grove": { lat: 33.7739, lng: -117.9415 },
  "Chattanooga": { lat: 35.0456, lng: -85.3097 },
  "Oceanside": { lat: 33.1959, lng: -117.3795 },
  "Jackson": { lat: 32.2988, lng: -90.1848 },
  "Fort Lauderdale": { lat: 26.1224, lng: -80.1373 },
  "Santa Rosa": { lat: 38.4404, lng: -122.7141 },
  "Rancho Cucamonga": { lat: 34.1064, lng: -117.5931 },
  "Port St. Lucie": { lat: 27.2730, lng: -80.3582 },
  "Tempe": { lat: 33.4255, lng: -111.9400 },
  "Ontario": { lat: 34.0633, lng: -117.6509 },
  "Vancouver": { lat: 45.6387, lng: -122.6615 },
  "Cape Coral": { lat: 26.5629, lng: -81.9495 },
  "Sioux Falls": { lat: 43.5460, lng: -96.7313 },
  "Springfield": { lat: 39.7817, lng: -89.6501 },
  "Peoria": { lat: 33.5806, lng: -112.2374 },
  "Pembroke Pines": { lat: 26.0070, lng: -80.2962 },
  "Elk Grove": { lat: 38.4088, lng: -121.3716 },
  "Salem": { lat: 44.9429, lng: -123.0351 },
  "Lancaster": { lat: 34.6868, lng: -118.1542 },
  "Corona": { lat: 33.8753, lng: -117.5664 },
  "Eugene": { lat: 44.0521, lng: -123.0868 },
  "Palmdale": { lat: 34.5794, lng: -118.1165 },
  "Salinas": { lat: 36.6777, lng: -121.6555 },
  "Pasadena": { lat: 34.1478, lng: -118.1445 },
  "Fort Collins": { lat: 40.5853, lng: -105.0844 },
  "Hayward": { lat: 37.6688, lng: -122.0808 },
  "Pomona": { lat: 34.0550, lng: -117.7520 },
  "Cary": { lat: 35.7915, lng: -78.7811 },
  "Rockford": { lat: 42.2711, lng: -89.0940 },
  "Alexandria": { lat: 38.8048, lng: -77.0469 },
  "Escondido": { lat: 33.1192, lng: -117.0864 },
  "McKinney": { lat: 33.1972, lng: -96.6397 },
  "Joliet": { lat: 41.5250, lng: -88.0817 },
  "Sunnyvale": { lat: 37.3688, lng: -122.0363 },
  "Torrance": { lat: 33.8358, lng: -118.3406 },
  "Bridgeport": { lat: 41.1865, lng: -73.1952 },
  "Lakewood": { lat: 39.7047, lng: -105.0814 },
  "Hollywood": { lat: 26.0112, lng: -80.1495 },
  "Paterson": { lat: 40.9168, lng: -74.1718 },
  "Naperville": { lat: 41.7508, lng: -88.1535 },
  "Syracuse": { lat: 43.0481, lng: -76.1474 },
  "Mesquite": { lat: 32.7668, lng: -96.5991 },
  "Dayton": { lat: 39.7589, lng: -84.1916 },
  "Savannah": { lat: 32.0809, lng: -81.0912 },
  "Clarksville": { lat: 36.5298, lng: -87.3595 },
  "Orange": { lat: 33.7879, lng: -117.8531 },
  "Fullerton": { lat: 33.8704, lng: -117.9242 },
  "Killeen": { lat: 31.1171, lng: -97.7278 },
  "Frisco": { lat: 33.1507, lng: -96.8236 },
  "Hampton": { lat: 37.0299, lng: -76.3452 },
  "McAllen": { lat: 26.2034, lng: -98.2300 },
  "Warren": { lat: 42.5145, lng: -83.0146 },
  "Bellevue": { lat: 47.6101, lng: -122.2015 },
  "West Valley City": { lat: 40.6916, lng: -112.0011 },
  "Columbia": { lat: 34.0007, lng: -81.0348 },
  "Olathe": { lat: 38.8814, lng: -94.8191 },
  "Sterling Heights": { lat: 42.5803, lng: -83.0302 },
  "New Haven": { lat: 41.3083, lng: -72.9279 },
  "Miramar": { lat: 25.9773, lng: -80.3322 },
  "Waco": { lat: 31.5493, lng: -97.1467 },
  "Thousand Oaks": { lat: 34.1706, lng: -118.8376 },
  "Cedar Rapids": { lat: 41.9779, lng: -91.6656 },
  "Charleston": { lat: 32.7765, lng: -79.9311 },
  "Visalia": { lat: 36.3302, lng: -119.2921 },
  "Topeka": { lat: 39.0558, lng: -95.6890 },
  "Elizabeth": { lat: 40.6640, lng: -74.2107 },
  "Gainesville": { lat: 29.6516, lng: -82.3248 },
  "Thornton": { lat: 39.8681, lng: -104.9719 },
  "Roseville": { lat: 38.7521, lng: -121.2880 },
  "Carrollton": { lat: 32.9537, lng: -96.8903 },
  "Coral Springs": { lat: 26.2709, lng: -80.2706 },
  "Stamford": { lat: 41.0534, lng: -73.5387 },
  "Simi Valley": { lat: 34.2694, lng: -118.7815 },
  "Concord": { lat: 37.9780, lng: -122.0311 },
  "Hartford": { lat: 41.7658, lng: -72.6734 },
  "Kent": { lat: 47.3809, lng: -122.2348 },
  "Lafayette": { lat: 30.2241, lng: -92.0198 },
  "Midland": { lat: 31.9973, lng: -102.0779 },
  "Surprise": { lat: 33.6292, lng: -112.3679 },
  "Denton": { lat: 33.2148, lng: -97.1331 },
  "Victorville": { lat: 34.5362, lng: -117.2911 },
  "Evansville": { lat: 37.9748, lng: -87.5558 },
  "Santa Clara": { lat: 37.3541, lng: -121.9552 },
  "Abilene": { lat: 32.4487, lng: -99.7331 },
  "Athens": { lat: 33.9519, lng: -83.3576 },
  "Vallejo": { lat: 38.1041, lng: -122.2566 },
  "Allentown": { lat: 40.6023, lng: -75.4714 },
  "Norman": { lat: 35.2226, lng: -97.4395 },
  "Beaumont": { lat: 30.0802, lng: -94.1266 },
  "Independence": { lat: 39.0911, lng: -94.4155 },
  "Murfreesboro": { lat: 35.8456, lng: -86.3903 },
  "Ann Arbor": { lat: 42.2808, lng: -83.7430 },
  "Berkeley": { lat: 37.8716, lng: -122.2727 },
  "Provo": { lat: 40.2338, lng: -111.6585 },
  "El Monte": { lat: 34.0686, lng: -118.0276 },
  "Lansing": { lat: 42.7325, lng: -84.5555 },
  "Fargo": { lat: 46.8772, lng: -96.7898 },
  "Downey": { lat: 33.9401, lng: -118.1332 },
  "Costa Mesa": { lat: 33.6633, lng: -117.9143 },
  "Wilmington": { lat: 34.2257, lng: -77.9447 },
  "Arvada": { lat: 39.8028, lng: -105.0875 },
  "Inglewood": { lat: 33.9617, lng: -118.3531 },
  "Miami Gardens": { lat: 25.9420, lng: -80.2456 },
  "Carlsbad": { lat: 33.1581, lng: -117.3506 },
  "Westminster": { lat: 33.7513, lng: -117.9940 },
  "Odessa": { lat: 31.8457, lng: -102.3676 },
  "Manchester": { lat: 42.9956, lng: -71.4548 },
  "Elgin": { lat: 42.0354, lng: -88.2826 },
  "West Jordan": { lat: 40.6097, lng: -111.9391 },
  "Round Rock": { lat: 30.5083, lng: -97.6789 },
  "Clearwater": { lat: 27.9659, lng: -82.8001 },
  "Waterbury": { lat: 41.5582, lng: -73.0515 },
  "Gresham": { lat: 45.5001, lng: -122.4302 },
  "Fairfield": { lat: 38.2494, lng: -122.0399 },
  "Billings": { lat: 45.7833, lng: -108.5007 },
  "Lowell": { lat: 42.6334, lng: -71.3162 },
  "San Buenaventura": { lat: 34.2746, lng: -119.2290 },
  "Pueblo": { lat: 38.2544, lng: -104.6091 },
  "High Point": { lat: 35.9557, lng: -80.0053 },
  "West Covina": { lat: 34.0686, lng: -117.9390 },
  "Murrieta": { lat: 33.5539, lng: -117.2139 },
  "Cambridge": { lat: 42.3736, lng: -71.1097 },
  "Antioch": { lat: 38.0049, lng: -121.8058 },
  "Temecula": { lat: 33.4936, lng: -117.1484 },
  "Norwalk": { lat: 33.9022, lng: -118.0817 },
  "Centennial": { lat: 39.5807, lng: -104.8771 },
  "Everett": { lat: 47.9790, lng: -122.2021 },
  "Palm Bay": { lat: 28.0345, lng: -80.5887 },
  "Wichita Falls": { lat: 33.9137, lng: -98.4934 },
  "Green Bay": { lat: 44.5133, lng: -88.0133 },
  "Daly City": { lat: 37.7058, lng: -122.4594 },
  "Burbank": { lat: 34.1808, lng: -118.3090 },
  "Richardson": { lat: 32.9483, lng: -96.7299 },
  "Pompano Beach": { lat: 26.2379, lng: -80.1248 },
  "North Charleston": { lat: 32.8546, lng: -79.9748 },
  "Broken Arrow": { lat: 36.0526, lng: -95.7969 },
  "Boulder": { lat: 40.0150, lng: -105.2705 },
  "West Palm Beach": { lat: 26.7153, lng: -80.0534 },
  "Santa Maria": { lat: 34.9530, lng: -120.4357 },
  "El Cajon": { lat: 32.7948, lng: -116.9625 },
  "Davenport": { lat: 41.5236, lng: -90.5776 },
  "Rialto": { lat: 34.1064, lng: -117.3703 },
  "Las Cruces": { lat: 32.3199, lng: -106.7637 },
  "San Mateo": { lat: 37.5630, lng: -122.3255 },
  "Lewisville": { lat: 33.0462, lng: -96.9942 },
  "South Bend": { lat: 41.6764, lng: -86.2520 },
  "Lakeland": { lat: 28.0395, lng: -81.9499 },
  "Erie": { lat: 42.1292, lng: -80.0851 },
  "Tyler": { lat: 32.3513, lng: -95.3011 },
  "Pearland": { lat: 29.5636, lng: -95.2861 },
  "College Station": { lat: 30.6280, lng: -96.3344 },
  "Kenosha": { lat: 42.5847, lng: -87.8212 },
  "Sandy Springs": { lat: 33.9304, lng: -84.3733 },
  "Clovis": { lat: 36.8252, lng: -119.7029 },
  "Flint": { lat: 43.0125, lng: -83.6875 },
  "Roanoke": { lat: 37.2710, lng: -79.9414 },
  "Albany": { lat: 42.6526, lng: -73.7562 },
  "Jurupa Valley": { lat: 33.9971, lng: -117.4855 },
  "Compton": { lat: 33.8958, lng: -118.2201 },
  "San Angelo": { lat: 31.4638, lng: -100.4370 },
  "Hillsboro": { lat: 45.5229, lng: -122.9898 },
  "Lawton": { lat: 34.6036, lng: -98.3959 },
  "Renton": { lat: 47.4829, lng: -122.2171 },
  "Vista": { lat: 33.2000, lng: -117.2425 },
  "Davie": { lat: 26.0765, lng: -80.2523 },
  "Greeley": { lat: 40.4233, lng: -104.7091 },
  "Mission Viejo": { lat: 33.6000, lng: -117.6720 },
  "Portsmouth": { lat: 36.8354, lng: -76.2983 },
  "Dearborn": { lat: 42.3223, lng: -83.1763 },
  "South Gate": { lat: 33.9548, lng: -118.2120 },
  "Tuscaloosa": { lat: 33.2098, lng: -87.5692 },
  "Livonia": { lat: 42.3684, lng: -83.3527 },
  "New Bedford": { lat: 41.6362, lng: -70.9342 },
  "Vacaville": { lat: 38.3566, lng: -121.9877 },
  "Brockton": { lat: 42.0806, lng: -71.0160 },
  "Roswell": { lat: 34.0232, lng: -84.3616 },
  "Beaverton": { lat: 45.4871, lng: -122.8037 },
  "Quincy": { lat: 42.2529, lng: -71.0023 },
  "Sparks": { lat: 39.5349, lng: -119.7527 },
  "Yakima": { lat: 46.6021, lng: -120.5059 },
  "Lee's Summit": { lat: 38.9108, lng: -94.3822 },
  "Federal Way": { lat: 47.3223, lng: -122.3126 },
  "Carson": { lat: 33.8317, lng: -118.2820 },
  "Santa Monica": { lat: 34.0195, lng: -118.4912 },
  "Hesperia": { lat: 34.4264, lng: -117.3009 },
  "Allen": { lat: 33.1032, lng: -96.6706 },
  "Rio Rancho": { lat: 35.2328, lng: -106.6630 },
  "Yuma": { lat: 32.6927, lng: -114.6277 },
  "Orem": { lat: 40.2969, lng: -111.6946 },
  "Lynn": { lat: 42.4668, lng: -70.9495 },
  "Redding": { lat: 40.5865, lng: -122.3917 },
  "Spokane Valley": { lat: 47.6732, lng: -117.2394 },
  "Miami Beach": { lat: 25.7907, lng: -80.1300 },
  "League City": { lat: 29.5074, lng: -95.0949 },
  "Lawrence": { lat: 38.9717, lng: -95.2353 },
  "Santa Barbara": { lat: 34.4208, lng: -119.6982 },
  "Plantation": { lat: 26.1276, lng: -80.2331 },
  "Sandy": { lat: 40.5649, lng: -111.8389 },
  "Sunrise": { lat: 26.1669, lng: -80.2564 },
  "Macon": { lat: 32.8407, lng: -83.6324 },
  "Longmont": { lat: 40.1672, lng: -105.1019 },
  "Boca Raton": { lat: 26.3683, lng: -80.1289 },
  "San Marcos": { lat: 33.1434, lng: -117.1661 },
  "Greenville": { lat: 34.8526, lng: -77.4103 },
  "Waukegan": { lat: 42.3636, lng: -87.8448 },
  "Fall River": { lat: 41.7015, lng: -71.1550 },
  "Chico": { lat: 39.7285, lng: -121.8375 },
  "Newton": { lat: 42.3370, lng: -71.2092 },
  "San Leandro": { lat: 37.7249, lng: -122.1561 },
  "Reading": { lat: 40.3356, lng: -75.9269 },
  "Fort Smith": { lat: 35.3859, lng: -94.3985 },
  "Newport Beach": { lat: 33.6189, lng: -117.9289 },
  "Asheville": { lat: 35.5951, lng: -82.5515 },
  "Nashua": { lat: 42.7654, lng: -71.4676 },
  "Edmond": { lat: 35.6528, lng: -97.4781 },
  "Whittier": { lat: 33.9792, lng: -118.0328 },
  "Nampa": { lat: 43.5407, lng: -116.5635 },
  "Bloomington": { lat: 39.1653, lng: -86.5264 },
  "Deltona": { lat: 28.9005, lng: -81.2637 },
  "Hawthorne": { lat: 33.9164, lng: -118.3526 },
  "Duluth": { lat: 46.7867, lng: -92.1005 },
  "Carmel": { lat: 39.9784, lng: -86.1180 },
  "Suffolk": { lat: 36.7282, lng: -76.5836 },
  "Clifton": { lat: 40.8584, lng: -74.1638 },
  "Citrus Heights": { lat: 38.7071, lng: -121.2810 },
  "Livermore": { lat: 37.6819, lng: -121.7680 },
  "Tracy": { lat: 37.7397, lng: -121.4252 },
  "Alhambra": { lat: 34.0953, lng: -118.1270 },
  "Kirkland": { lat: 47.6815, lng: -122.2087 },
  "Trenton": { lat: 40.2206, lng: -74.7597 },
  "Ogden": { lat: 41.2230, lng: -111.9738 },
  "Hoover": { lat: 33.4054, lng: -86.8114 },
  "Cicero": { lat: 41.8456, lng: -87.7539 },
  "Fishers": { lat: 39.9556, lng: -86.0139 },
  "Sugar Land": { lat: 29.6196, lng: -95.6349 },
  "Danbury": { lat: 41.3948, lng: -73.4540 },
  "Meridian": { lat: 43.6121, lng: -116.3915 },
  "Indio": { lat: 33.7206, lng: -116.2156 },
  "Menifee": { lat: 33.6971, lng: -117.1853 },
  "Champaign": { lat: 40.1164, lng: -88.2434 },
  "Buena Park": { lat: 33.8675, lng: -117.9981 },
  "Troy": { lat: 42.6064, lng: -83.1498 },
  "O'Fallon": { lat: 38.8106, lng: -90.6998 },
  "Johns Creek": { lat: 34.0289, lng: -84.1986 },
  "Bellingham": { lat: 48.7519, lng: -122.4787 },
  "Westland": { lat: 42.3242, lng: -83.4002 },
  "Sioux City": { lat: 42.4960, lng: -96.4003 },
  "Warwick": { lat: 41.7001, lng: -71.4162 },
  "Hemet": { lat: 33.7475, lng: -116.9719 },
  "Longview": { lat: 32.5007, lng: -94.7404 },
  "Farmington Hills": { lat: 42.4989, lng: -83.3677 },
  "Bend": { lat: 44.0582, lng: -121.3153 },
  "Merced": { lat: 37.3022, lng: -120.4830 },
  "Mission": { lat: 26.2159, lng: -98.3253 },
  "Chino": { lat: 34.0122, lng: -117.6889 },
  "Redwood City": { lat: 37.4852, lng: -122.2364 },
  "Edinburg": { lat: 26.3017, lng: -98.1633 },
  "Cranston": { lat: 41.7798, lng: -71.4373 },
  "Parma": { lat: 41.4045, lng: -81.7229 },
  "New Rochelle": { lat: 40.9115, lng: -73.7823 },
  "Lake Forest": { lat: 33.6469, lng: -117.6892 },
  "Napa": { lat: 38.2975, lng: -122.2869 },
  "Hammond": { lat: 41.5834, lng: -87.5000 },
  "Avondale": { lat: 33.4356, lng: -112.3496 },
  "Somerville": { lat: 42.3876, lng: -71.0995 },
  "Palm Coast": { lat: 29.5845, lng: -81.3088 },
  "Bryan": { lat: 30.6744, lng: -96.3700 },
  "Gary": { lat: 41.5934, lng: -87.3464 },
  "Largo": { lat: 27.9095, lng: -82.7873 },
  "Brooklyn Park": { lat: 45.0941, lng: -93.3563 },
  "Tustin": { lat: 33.7458, lng: -117.8262 },
  "Racine": { lat: 42.7261, lng: -87.7829 },
  "Deerfield Beach": { lat: 26.3184, lng: -80.0998 },
  "Lynchburg": { lat: 37.4138, lng: -79.1422 },
  "Mountain View": { lat: 37.3861, lng: -122.0839 },
  "Medford": { lat: 42.3265, lng: -122.8756 },
  "Bellflower": { lat: 33.8817, lng: -118.1170 },
  "Melbourne": { lat: 28.0836, lng: -80.6081 },
  "St. Joseph": { lat: 39.7391, lng: -94.8469 },
  "Camden": { lat: 39.9259, lng: -75.1196 },
  "St. George": { lat: 37.0965, lng: -113.5684 },
  "Kennewick": { lat: 46.2112, lng: -119.1372 },
  "Baldwin Park": { lat: 34.0853, lng: -117.9609 },
  "Chino Hills": { lat: 33.9898, lng: -117.7326 },
  "Alameda": { lat: 37.7652, lng: -122.2416 },
  "Arlington Heights": { lat: 42.0884, lng: -87.9806 },
  "Scranton": { lat: 41.4090, lng: -75.6624 },
  "Evanston": { lat: 42.0451, lng: -87.6877 },
  "Kalamazoo": { lat: 42.2917, lng: -85.5872 },
  "Baytown": { lat: 29.7355, lng: -94.9774 },
  "Upland": { lat: 34.0975, lng: -117.6484 },
  "Springdale": { lat: 36.1867, lng: -94.1288 },
  "Bethlehem": { lat: 40.6259, lng: -75.3705 },
  "Schaumburg": { lat: 42.0334, lng: -88.0834 },
  "Mount Pleasant": { lat: 32.7940, lng: -79.8626 },
  "Auburn": { lat: 32.6099, lng: -85.4808 },
  "Decatur": { lat: 34.6059, lng: -86.9833 },
  "San Ramon": { lat: 37.7799, lng: -121.9780 },
  "Pleasanton": { lat: 37.6624, lng: -121.8747 },
  "Union City": { lat: 37.5933, lng: -122.0438 },
  "Boynton Beach": { lat: 26.5318, lng: -80.0906 },
  "Waukesha": { lat: 43.0117, lng: -88.2315 },
  "Gulfport": { lat: 30.3674, lng: -89.0928 },
  "Apple Valley": { lat: 34.5008, lng: -117.1859 },
  "Passaic": { lat: 40.8568, lng: -74.1285 },
  "Rapid City": { lat: 44.0805, lng: -103.2310 },
  "Layton": { lat: 41.0602, lng: -111.9711 },
  "Turlock": { lat: 37.4947, lng: -120.8466 },
  "Muncie": { lat: 40.1934, lng: -85.3863 },
  "Temple": { lat: 31.0982, lng: -97.3428 },
  "Missouri City": { lat: 29.5686, lng: -95.5377 },
  "Redlands": { lat: 34.0556, lng: -117.1825 },
  "Santa Fe": { lat: 35.6870, lng: -105.9378 },
  "Lauderhill": { lat: 26.1404, lng: -80.2134 },
  "Milpitas": { lat: 37.4323, lng: -121.8996 },
  "Palatine": { lat: 42.1103, lng: -88.0342 },
  "Missoula": { lat: 46.8787, lng: -113.9966 },
  "Rock Hill": { lat: 34.9249, lng: -81.0251 },
  "Franklin": { lat: 36.7228, lng: -86.8689 },
  "Flagstaff": { lat: 35.1983, lng: -111.6513 },
  "Flower Mound": { lat: 33.0146, lng: -97.0969 },
  "Weston": { lat: 26.1003, lng: -80.3997 },
  "Waterloo": { lat: 42.4928, lng: -92.3426 },
  "Mount Vernon": { lat: 40.9126, lng: -73.8370 },
  "Fort Myers": { lat: 26.6406, lng: -81.8723 },
  "Dothan": { lat: 31.2232, lng: -85.3905 },
  "Rancho Cordova": { lat: 38.5891, lng: -121.3027 },
  "Redondo Beach": { lat: 33.8492, lng: -118.3884 },
  "Pasco": { lat: 46.2396, lng: -119.1006 },
  "St. Charles": { lat: 38.7881, lng: -90.4974 },
  "Eau Claire": { lat: 44.8113, lng: -91.4985 },
  "North Richland Hills": { lat: 32.8343, lng: -97.2289 },
  "Bismarck": { lat: 46.8083, lng: -100.7837 },
  "Yorba Linda": { lat: 33.8886, lng: -117.8131 },
  "Kenner": { lat: 29.9941, lng: -90.2417 },
  "Walnut Creek": { lat: 37.9101, lng: -122.0652 },
  "Frederick": { lat: 39.4143, lng: -77.4105 },
  "Oshkosh": { lat: 44.0247, lng: -88.5426 },
  "Pittsburg": { lat: 38.0280, lng: -121.8847 },
  "Palo Alto": { lat: 37.4419, lng: -122.1430 },
  "Bossier City": { lat: 32.5160, lng: -93.7321 },
  "St. Cloud": { lat: 45.5608, lng: -94.1624 },
  "Davis": { lat: 38.5449, lng: -121.7405 },
  "South San Francisco": { lat: 37.6547, lng: -122.4077 },
  "Camarillo": { lat: 34.2164, lng: -119.0376 },
  "Walnut": { lat: 34.0200, lng: -117.8653 },
  "Littleton": { lat: 39.6133, lng: -105.0166 },
  "Haltom City": { lat: 32.7995, lng: -97.2692 },
  "Lompoc": { lat: 34.6391, lng: -120.4579 },
  "El Centro": { lat: 32.7920, lng: -115.5631 },
  "Danville": { lat: 37.8216, lng: -121.9999 },
  "Jeffersonville": { lat: 38.2776, lng: -85.7372 },
  "San Jacinto": { lat: 33.7839, lng: -116.9586 },
  "Altoona": { lat: 40.5187, lng: -78.3947 },
  "Beavercreek": { lat: 39.7092, lng: -84.0633 },
  "Apopka": { lat: 28.6934, lng: -81.5322 },
  "Hoffman Estates": { lat: 42.0630, lng: -88.1220 },
  "Florissant": { lat: 38.7892, lng: -90.3226 },
  "Placentia": { lat: 33.8722, lng: -117.8703 },
  "West New York": { lat: 40.7878, lng: -74.0143 },
  "Dublin": { lat: 37.7022, lng: -121.9358 },
  "Oak Park": { lat: 41.8850, lng: -87.7845 },
  "Dearborn Heights": { lat: 42.3370, lng: -83.2733 },
  "Oro Valley": { lat: 32.3909, lng: -110.9665 },
  "Bedford": { lat: 32.8440, lng: -97.1431 },
  "Eastvale": { lat: 33.9525, lng: -117.5848 },
  "Porterville": { lat: 36.0652, lng: -119.0168 },
  "Westfield": { lat: 42.1251, lng: -72.7495 },
  "Caldwell": { lat: 43.6629, lng: -116.6874 },
  "Logan": { lat: 41.7370, lng: -111.8338 },
  "Galveston": { lat: 29.3013, lng: -94.7977 },
  "Sheboygan": { lat: 43.7508, lng: -87.7145 },
  "Middletown": { lat: 39.5151, lng: -84.3983 },
  "Murray": { lat: 40.6669, lng: -111.8880 },
  "Parker": { lat: 39.5186, lng: -104.7614 },
  "East Orange": { lat: 40.7673, lng: -74.2049 },
  "Shawnee": { lat: 39.0228, lng: -94.7158 },
  "Covina": { lat: 34.0900, lng: -117.8903 },
  "Olympia": { lat: 47.0379, lng: -122.9007 },
  "Euclid": { lat: 41.5931, lng: -81.5268 },
  "Mishawaka": { lat: 41.6620, lng: -86.1586 },
  "Salina": { lat: 38.8403, lng: -97.6114 },
  "Azusa": { lat: 34.1336, lng: -117.9076 },
  "New Braunfels": { lat: 29.7030, lng: -98.1245 },
  "Cedar Hill": { lat: 32.5885, lng: -96.9561 },
  "Mansfield": { lat: 40.8059, lng: -82.5154 },
  "Hattiesburg": { lat: 31.3271, lng: -89.2903 },
  "Bonita Springs": { lat: 26.3398, lng: -81.7787 },
  "Portage": { lat: 42.2012, lng: -85.5800 },
  "St. Peters": { lat: 38.7874, lng: -90.6299 },
  "Chapel Hill": { lat: 35.9132, lng: -79.0558 },
  "Tamarac": { lat: 26.2129, lng: -80.2497 },
  "Madera": { lat: 36.9613, lng: -120.0607 },
  "Conway": { lat: 35.0887, lng: -92.4421 },
  "Maumee": { lat: 41.5639, lng: -83.6544 },
  "Georgetown": { lat: 30.6327, lng: -97.6779 },
  "Paramount": { lat: 33.8895, lng: -118.1598 },
  "Grand Junction": { lat: 39.0639, lng: -108.5506 },
  "Rocklin": { lat: 38.7907, lng: -121.2358 },
  "Petaluma": { lat: 38.2324, lng: -122.6367 },
  "Southfield": { lat: 42.4734, lng: -83.2219 },
  "Rochester Hills": { lat: 42.6583, lng: -83.1499 },
  "New Britain": { lat: 41.6612, lng: -72.7795 },
  "Goodyear": { lat: 33.4355, lng: -112.3576 },
  "Canton": { lat: 40.7989, lng: -81.3784 },
  "Warner Robins": { lat: 32.6130, lng: -83.6241 },
  "Perris": { lat: 33.7825, lng: -117.2286 },
  "Manteca": { lat: 37.7974, lng: -121.2160 },
  "Iowa City": { lat: 41.6611, lng: -91.5302 },
  "Jonesboro": { lat: 35.8423, lng: -90.7043 },
  "Lynwood": { lat: 33.9303, lng: -118.2115 },
  "Loveland": { lat: 40.3978, lng: -105.0750 },
  "Pawtucket": { lat: 41.8787, lng: -71.3828 },
};

export function useDashboardData() {
  const [rawData, setRawData] = useState<DashboardData | null>(null);
  const [filters, setFilters] = useState<Filters>({
    models: [],
    year: "all",
    cities: [],
    payMethods: [],
    dateStart: "",
    dateEnd: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/dashboard_data.json")
      .then((r) => r.json())
      .then((data: DashboardData) => {
        setRawData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  const processedRecords = useMemo(() => {
    if (!rawData) return [];
    return rawData.records
      .filter(isValidRecord)
      .map((r) => ({
        ...r,
        PayMethod: unifyPayMethod(r.PayMethod),
        Price: String(parseFloat(r.Price) || 0),
      }));
  }, [rawData]);

  const aggregated = useMemo((): AggregatedData | null => {
    if (!rawData || !processedRecords.length) return null;

    const familyMap: Record<string, string> = {
      "911": "911", "Taycan": "Taycan", "Cayenne": "Cayenne",
      "Macan": "Macan", "Panamera": "Panamera", "718": "718"
    };

    const safeModel = (m: string | undefined | null): string => (m || "Unknown");
    const getFamily = (m: string | undefined | null): string => {
      const model = safeModel(m);
      return familyMap[model.split(" ")[0]] || model;
    };

    const filtered = processedRecords.filter((r) => {
      if (filters.models.length > 0 && !filters.models.includes(r.Model)) return false;
      if (filters.year !== "all" && r.ModelYear !== filters.year) return false;
      if (filters.cities.length > 0 && !filters.cities.includes(r.City)) return false;
      if (filters.payMethods.length > 0 && !filters.payMethods.includes(r.PayMethod)) return false;
      if (filters.dateStart && r.SaleDate < filters.dateStart) return false;
      if (filters.dateEnd && r.SaleDate > filters.dateEnd) return false;
      return true;
    });

    const records = filtered.length > 0 ? filtered : processedRecords;
    const totalRevenue = records.reduce((s, r) => s + (parseFloat(r.Price) || 0), 0);
    const avgTicket = records.length > 0 ? totalRevenue / records.length : 0;
    const uniqueCities = new Set(records.map((r) => r.City).filter(Boolean)).size;
    const uniqueStates = new Set(records.map((r) => r.State).filter(Boolean)).size;

    const validModels = Array.from(new Set(processedRecords.map(r => r.Model))).sort();
    const validYears = Array.from(new Set(processedRecords.map(r => r.ModelYear))).sort();
    const validCities = Array.from(new Set(processedRecords.map(r => r.City))).sort();
    const validPayMethods = Array.from(new Set(processedRecords.map(r => r.PayMethod))).sort();

    // Date range
    const dates = processedRecords.map(r => r.SaleDate).filter(d => d && d !== "INVALID").sort();
    const dateRange = { min: dates[0] || "", max: dates[dates.length - 1] || "" };

    // Sales by model
    const salesByModel: Record<string, number> = {};
    records.forEach((r) => { salesByModel[r.Model] = (salesByModel[r.Model] || 0) + 1; });

    const salesByFamily: Record<string, number> = {};
    records.forEach((r) => {
      const family = getFamily(r.Model);
      salesByFamily[family] = (salesByFamily[family] || 0) + 1;
    });

    const revenueByModel: Record<string, { revenue: number; count: number }> = {};
    records.forEach((r) => {
      const price = parseFloat(r.Price) || 0;
      if (!revenueByModel[r.Model]) revenueByModel[r.Model] = { revenue: 0, count: 0 };
      revenueByModel[r.Model].revenue += price;
      revenueByModel[r.Model].count += 1;
    });

    const revenueByFamily: Record<string, { revenue: number; count: number }> = {};
    records.forEach((r) => {
      const family = getFamily(r.Model);
      const price = parseFloat(r.Price) || 0;
      if (!revenueByFamily[family]) revenueByFamily[family] = { revenue: 0, count: 0 };
      revenueByFamily[family].revenue += price;
      revenueByFamily[family].count += 1;
    });

    const salesByYear: Record<string, number> = {};
    records.forEach((r) => {
      if (r.ModelYear) salesByYear[r.ModelYear] = (salesByYear[r.ModelYear] || 0) + 1;
    });

    const salesByPay: Record<string, number> = {};
    records.forEach((r) => { salesByPay[r.PayMethod] = (salesByPay[r.PayMethod] || 0) + 1; });

    const cityRevenue: Record<string, { revenue: number; count: number }> = {};
    records.forEach((r) => {
      const price = parseFloat(r.Price) || 0;
      if (!cityRevenue[r.City]) cityRevenue[r.City] = { revenue: 0, count: 0 };
      cityRevenue[r.City].revenue += price;
      cityRevenue[r.City].count += 1;
    });

    const stateCount: Record<string, number> = {};
    records.forEach((r) => { stateCount[r.State] = (stateCount[r.State] || 0) + 1; });

    const statusDist: Record<string, number> = {};
    records.forEach((r) => { statusDist[r.Status] = (statusDist[r.Status] || 0) + 1; });

    const modelsByCity: Record<string, { model: string; sales: number; revenue: number }> = {};
    const cityModelCounts: Record<string, Record<string, number>> = {};
    records.forEach((r) => {
      const price = parseFloat(r.Price) || 0;
      const model = safeModel(r.Model);
      const city = r.City || "Unknown";
      if (!modelsByCity[city]) modelsByCity[city] = { model: model, sales: 0, revenue: 0 };
      modelsByCity[city].sales += 1;
      modelsByCity[city].revenue += price;
      if (!cityModelCounts[city]) cityModelCounts[city] = {};
      cityModelCounts[city][model] = (cityModelCounts[city][model] || 0) + 1;
    });
    Object.keys(cityModelCounts).forEach((city) => {
      const counts = cityModelCounts[city];
      const topModel = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (topModel) modelsByCity[city].model = topModel[0];
    });

    const top5Models = sortEntries(Object.entries(salesByModel), "value").slice(0, 5)
      .reduce((acc: Record<string, number>, [k, v]) => ({ ...acc, [k]: v as number }), {});
    const top5Cities = sortEntries(Object.entries(cityRevenue), "count").slice(0, 5)
      .reduce((acc: Record<string, number>, [k, v]) => ({ ...acc, [k]: (v as any).count }), {});
    const top5Pay = sortEntries(Object.entries(salesByPay), "value").slice(0, 5)
      .reduce((acc: Record<string, number>, [k, v]) => ({ ...acc, [k]: v as number }), {});

    const topCitiesArr = sortEntries(Object.entries(cityRevenue), "revenue");
    const sortedModelsArr = sortEntries(Object.entries(salesByModel), "value");
    const topYear = Object.entries(salesByYear).sort(([, a], [, b]) => b - a)[0]?.[0] || "0";

    // City data for map
    const cityDataForMap = topCitiesArr
      .map(([city, data]) => {
        const coords = CITY_COORDS[city];
        if (!coords) return null;
        return {
          city,
          state: records.find(r => r.City === city)?.State || "",
          lat: coords.lat,
          lng: coords.lng,
          revenue: (data as { revenue: number; count: number }).revenue,
          count: (data as { revenue: number; count: number }).count,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);

    const execText = topCitiesArr.length > 0 && sortedModelsArr.length > 0
      ? `As vendas concentram-se em ${topCitiesArr[0][0]} (${(topCitiesArr[0][1] as any).count} vendas), com o ${sortedModelsArr[0][0]} como modelo mais vendido (${sortedModelsArr[0][1]} unidades). Receita total de $${(totalRevenue / 1000000).toFixed(1)}M em ${records.length} transacoes. Modelo dominante em ${uniqueCities} cidades.`
      : "Selecione filtros para gerar insights.";

    return {
      filteredCount: filtered.length,
      kpis: {
        total_sales: records.length,
        total_revenue: totalRevenue,
        avg_ticket: avgTicket,
        unique_cities: uniqueCities,
        unique_states: uniqueStates,
        top_model: sortedModelsArr[0]?.[0] || "N/A",
        top_city: topCitiesArr[0]?.[0] || "N/A",
        top_year: parseInt(topYear),
        top_pay_method: sortEntries(Object.entries(salesByPay), "value")[0]?.[0] || "N/A",
      },
      salesByModel,
      salesByFamily,
      revenueByModel,
      revenueByFamily,
      salesByYear,
      salesByPay,
      topCitiesRevenue: topCitiesArr.slice(0, 15).reduce((acc: Record<string, any>, [k, v]) => ({ ...acc, [k]: v }), {}),
      topStates: sortEntries(Object.entries(stateCount), "value").slice(0, 15).reduce((acc: Record<string, number>, [k, v]) => ({ ...acc, [k]: v as number }), {}),
      statusDist,
      modelsByCity,
      top5Models,
      top5Cities,
      top5Pay,
      executiveSummary: execText,
      filteredRecords: filtered.length > 0 ? filtered : processedRecords,
      validPayMethods,
      validModels,
      validYears,
      validCities,
      dateRange,
      cityDataForMap,
    };
  }, [rawData, processedRecords, filters]);

  const updateFilter = useCallback((key: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ models: [], year: "all", cities: [], payMethods: [], dateStart: "", dateEnd: "" });
  }, []);

  return { rawData, filters, aggregated, loading, updateFilter, clearFilters };
}
